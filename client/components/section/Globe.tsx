// components\section\Globe.tsx

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import UnderGlobe, { type GlobeMethods } from 'react-globe.gl';
import { TextureLoader, ShaderMaterial, Vector2 } from 'three';
// @ts-expect-error no type :(
import * as solar from 'solar-calculator';
import { convertGRUsToMeters } from '@lib/utils';

// https://thenewstack.io/recreating-shopifys-bfcm-globe-using-react-globe-gl/
// day/night cycle code: https://github.com/vasturiano/react-globe.gl/blob/master/example/day-night-cycle/index.html

function Globe({
  interactive,
  data,
  reportViewpoint,
  freezeRender = false,
  ref,
  markerCoordinates,
}: {
  interactive: boolean;
  data?: { message: string; longitude: number; latitude: number }[];
  reportViewpoint: ({
    fov,
    altitude,
    latitude,
    longitude,
  }: {
    fov: number;
    altitude: number;
    latitude: number;
    longitude: number;
  }) => void;
  freezeRender?: boolean;
  ref?: Ref<
    { setAutoSpin: (toggle: boolean) => void } & Pick<
      GlobeMethods,
      'pointOfView'
    >
  >;
  markerCoordinates?: { lat: number; lng: number };
}) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const globeRoot = useRef<HTMLDivElement | null>(null);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const [verticalOffset, setVerticalOffset] = useState<number>(
    interactive ? 0 : 500,
  );
  const [globeMaterial, setGlobeMaterial] = useState<ShaderMaterial>();

  // adjust the incoming data so that nearby messages get grouped into a single
  // datapoint for the globe
  const displayData = data?.map((val) => {
    return {
      message: [val.message],
      longitude: val.longitude,
      latitude: val.latitude,
    };
  });

  /**
   * when the component mounts, set it to autorotate the globe
   */
  useEffect(() => {
    if (!globeEl?.current) return;

    if (freezeRender) {
      // TODO: handle the animation pausing after initial render better than just waiting a few seconds
      setTimeout(() => {
        // @ts-expect-error checked to be defined a few lines up
        globeEl.current.pauseAnimation();
      }, 5000);
    }
    globeEl.current.controls().autoRotate = autoSpin;
    globeEl.current.controls().autoRotateSpeed = 0.1;
  }, [autoSpin, freezeRender]);

  const isInitialMount = useRef(true);

  /**
   * Pass some methods from the globe *up* to a parent component
   *
   * see https://react.dev/reference/react/useImperativeHandle
   */
  useImperativeHandle(ref, () => ({
    pointOfView: ((...args: Parameters<GlobeMethods['pointOfView']>) => {
      if (!globeEl.current) throw new Error('globe ref is not ready yet');
      return (globeEl.current.pointOfView as any)(...args);
    }) as GlobeMethods['pointOfView'],
    setAutoSpin: (toggle: boolean) => {
      setAutoSpin(toggle);
    },
  }));

  /**
   * Resize the canvas to the size of the viewport using ResizeObserver
   */
  useEffect(() => {
    if (!globeRoot.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === globeRoot.current) {
          setCanvasWidth(entry.contentRect.width);
          setCanvasHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(globeRoot.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * makes the globe start spinning again when the view is reset
   */
  useEffect(() => {
    if (!interactive) {
      setAutoSpin(true);
      globeEl?.current?.pointOfView({ altitude: 2 }, 1000);
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      toggleVerticalOffset();
    }
  }, [interactive]);

  const animationFrameId = useRef<number | null>(null);

  /**
   * gradually brings verticalOffset to 0 or 500 using a linear or cubic
   * ease-in-out animation.
   *
   * the verticalOffset is tied to the globe's vertical position in the viewport
   */
  const toggleVerticalOffset = (
    movement: 'linear' | 'ease' = 'ease',
    animationDuration = 1000,
  ) => {
    // if an animation is already running, cancel it
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    const startPos = interactive ? 500 : 0;
    const endPos = interactive ? 0 : 500;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / animationDuration, 1); // Ensure progress doesn't exceed 1

      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      };

      let newPos: number;

      switch (movement) {
        case 'linear': {
          newPos = startPos + (endPos - startPos) * linearProgress;
          break;
        }
        case 'ease': {
          newPos =
            startPos + (endPos - startPos) * easeInOutCubic(linearProgress);
          break;
        }
        default: {
          throw new Error(
            `[Home/resetScroll] unexpected value for movement: ${movement}`,
          );
        }
      }

      setVerticalOffset(newPos);

      // the animation is still running
      if (linearProgress < 1) {
        animationFrameId.current = requestAnimationFrame(animateScroll);
      } // the animation has finished
      else {
        animationFrameId.current = null;
      }
    };

    animationFrameId.current = requestAnimationFrame(animateScroll);
  };

  /**
   * when the component mounts, gets the textures that are going to wrap the
   * globe object and sets them as the globe material
   */
  useEffect(() => {
    Promise.all([
      new TextureLoader().loadAsync(
        // '/textures/earth/earth-day.jpg',
        '/textures/earth/8k_earth_daymap.jpg',
        // '/textures/earth/8k_earth_normal_map.tif',
      ),
      new TextureLoader().loadAsync(
        // '/textures/earth/earth-night.jpg',
        '/textures/earth/8k_earth_nightmap.jpg',
      ),
    ]).then(([dayTexture, nightTexture]) => {
      setGlobeMaterial(
        new ShaderMaterial({
          uniforms: {
            dayTexture: { value: dayTexture },
            nightTexture: { value: nightTexture },
            sunPosition: { value: new Vector2() },
            globeRotation: { value: new Vector2() },
          },
          vertexShader: dayNightShader.vertexShader,
          fragmentShader: dayNightShader.fragmentShader,
        }),
      );
    });
  }, []);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe) return;

    const handleViewpointChange = () => {
      const pov = globe.pointOfView();
      reportViewpoint({
        // @ts-expect-error due to type inconsistency of library, it is typed as
        // a Camera but is actually a PerspectiveCamera. Run
        // console.log(globeEl.current.camera()) to see for yourself.
        //
        // References:
        // https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.fov
        // https://github.com/vasturiano/react-globe.gl?tab=readme-ov-file#render-control
        fov: globe.camera().fov,
        altitude: Math.floor(convertGRUsToMeters(pov.altitude)),
        latitude: +pov.lat.toFixed(5),
        longitude: +pov.lng.toFixed(5),
      });
    };

    globe.controls().addEventListener('change', handleViewpointChange);

    handleViewpointChange();

    return () => {
      globe.controls().removeEventListener('change', handleViewpointChange);
    };
  }, [reportViewpoint]);

  /**
   * Updates the globe material's sun position uniform on an interval.
   * Runs only when globeMaterial is available.
   */
  useEffect(() => {
    if (!globeMaterial) return;

    // initial update
    globeMaterial.uniforms.sunPosition.value.set(...sunPosAt(+new Date()));

    // update every 5 seconds after that
    const intervalId = setInterval(() => {
      globeMaterial.uniforms.sunPosition.value.set(...sunPosAt(+new Date()));
    }, 5000);

    return () => clearInterval(intervalId);
  }, [globeMaterial]);

  // const renderCount = useRef<number>(0);
  // console.log(`Globe render count: ${renderCount.current}`);
  // renderCount.current += 1;

  return (
    <div
      data-testid={'globe-root-element'}
      className="cursor-move h-dvh"
      ref={globeRoot}
    >
      <UnderGlobe
        // disable autorotate when the user clicks the globe
        onGlobeClick={() => setAutoSpin(false)}
        globeMaterial={globeMaterial}
        showGlobe={!!globeMaterial}
        showAtmosphere={!!globeMaterial}
        width={canvasWidth}
        height={canvasHeight}
        waitForGlobeReady={false}
        enablePointerInteraction={!freezeRender}
        animateIn={!freezeRender}
        ref={globeEl}
        // backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        // backgroundImageUrl="/textures/skybox/night-sky.png"
        backgroundImageUrl="/textures/skybox/8k_stars_milky_way.jpg"
        // backgroundImageUrl="/textures/skybox/8k_stars.jpg"
        globeOffset={[0, verticalOffset]}
        backgroundColor="#00000000" // transparent
        onZoom={useCallback(
          ({ lng, lat }: { lng: number; lat: number }) =>
            globeMaterial?.uniforms.globeRotation.value.set(lng, lat),
          [globeMaterial],
        )}
        // user coords
        ringsData={markerCoordinates ? [markerCoordinates] : []}
        ringColor={() => 'white'}
        ringMaxRadius={1}
        ringRepeatPeriod={2000}
        ringPropagationSpeed={0.5}
        labelsData={markerCoordinates ? [markerCoordinates] : []}
        labelDotRadius={0.4}
        labelColor={() => 'white'}
        labelText={() => ''}
        // html elements
        htmlElementsData={displayData ?? undefined}
        // @ts-expect-error the library wants d to be an object without
        // specifying its properties, but I need types inside the function
        htmlLat={
          displayData
            ? (d: { latitude: number }) => {
                return d.latitude;
              }
            : undefined
        }
        // @ts-expect-error the library wants d to be an object without
        // specifying its properties, but I need types inside the function
        htmlLng={
          displayData
            ? (d: { longitude: number }) => {
                return d.longitude;
              }
            : undefined
        }
        htmlElementVisibilityModifier={(el, isVisible) => {
          el.style.opacity = isVisible ? '0.8' : '0';
        }}
        // @ts-expect-error the library wants d to be an object without
        // specifying its properties, but I need types inside the function
        htmlElement={
          displayData
            ? (d: { message: string[] }): HTMLElement => {
                // parent html element to contain all this stuff
                const element = document.createElement('div');
                // parent styling
                element.style.textAlign = 'center';
                element.style.maxWidth = '300px';
                element.style.backgroundColor = 'var(--color-slate-200)';
                element.style.borderRadius = '10px';
                element.style.padding = '0.25rem';
                element.style.borderColor = 'var(--color-slate-700)';
                element.style.borderWidth = '3px';
                element.style.transition = 'opacity 250ms'; // fades out of viewport
                // make parent brighter when user hovers over it
                element.style.pointerEvents = 'auto';
                element.onmouseenter = (event) => {
                  if (event.target instanceof HTMLElement)
                    event.target.style.opacity = '1';
                };
                element.onmouseleave = (event) => {
                  if (event.target instanceof HTMLElement)
                    event.target.style.opacity = '0.8';
                };

                // variable to select message in array to display
                let currentIndex = 0;

                // Create an element to display the message content
                const messageDisplay = document.createElement('span');
                messageDisplay.style.display = 'block'; // Ensure it takes its own line
                messageDisplay.style.marginBottom = '0.5rem'; // Space between message and buttons
                messageDisplay.style.color = 'var(--color-slate-700)';
                element.appendChild(messageDisplay);

                const updateMessageDisplay = () => {
                  if (d.message && d.message.length > 0) {
                    messageDisplay.textContent = d.message[currentIndex];
                  } else {
                    messageDisplay.textContent = 'No message available.';
                  }
                };
                if (d.message.length > 1) {
                  // button to nav backwards
                  const navBack = document.createElement('button');
                  navBack.style.marginRight = '0.5rem';
                  navBack.style.padding = '0.25rem 0.25rem';
                  navBack.style.backgroundColor = 'var(--color-slate-700)';
                  navBack.style.color = 'var(--color-slate-200)';
                  navBack.style.border = 'none';
                  navBack.style.borderRadius = '500px';
                  navBack.style.pointerEvents = 'auto';
                  navBack.style.cursor = 'pointer';
                  navBack.onclick = (event) => {
                    event.stopPropagation();
                    if (d.message && d.message.length > 0) {
                      currentIndex =
                        (currentIndex - 1 + d.message.length) %
                        d.message.length; // Loop around
                      updateMessageDisplay();
                      console.log(
                        'Navigated back to index:',
                        currentIndex,
                        'message:',
                        d.message[currentIndex],
                      );
                    }
                  };
                  navBack.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

                  // button to nav forwards
                  const navForward = document.createElement('button');
                  navForward.style.marginLeft = '0.5rem';
                  navForward.style.padding = '0.25rem 0.25rem';
                  navForward.style.backgroundColor = 'var(--color-slate-700)';
                  navForward.style.color = 'var(--color-slate-200)';
                  navForward.style.border = 'none';
                  navForward.style.borderRadius = '500px';
                  navForward.style.pointerEvents = 'auto';
                  navForward.style.cursor = 'pointer';
                  navForward.onclick = (event) => {
                    event.stopPropagation();
                    if (d.message && d.message.length > 0) {
                      currentIndex = (currentIndex + 1) % d.message.length; // Loop around
                      updateMessageDisplay();
                      console.log(
                        'Navigated forward to index:',
                        currentIndex,
                        'message:',
                        d.message[currentIndex],
                      );
                    }
                  };
                  navForward.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

                  // Append the buttons to the element
                  element.appendChild(navBack);
                  element.appendChild(navForward);
                }

                // Initial display of the message
                updateMessageDisplay();

                return element;
              }
            : undefined
        }
      />
    </div>
  );
}

// Custom shader:  Blends night and day images to simulate day/night cycle
const dayNightShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define PI 3.141592653589793
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform vec2 sunPosition;
    uniform vec2 globeRotation;
    varying vec3 vNormal;
    varying vec2 vUv;

    float toRad(in float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(in vec2 c) { // [lng, lat]
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3( // x,y,z
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(
        1, 0, 0,
        0, cos(invLat), -sin(invLat),
        0, sin(invLat), cos(invLat)
      );
      mat3 rotY = mat3(
        cos(invLon), 0, sin(invLon),
        0, 1, 0,
        -sin(invLon), 0, cos(invLon)
      );
      vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      gl_FragColor = mix(nightColor, dayColor, blendFactor);
    }
  `,
};

/**
 * @param date
 * @returns the calculated longitudinal position of the sun for a given date
 */
const sunPosAt = (date: number) => {
  const day = new Date(+date).setUTCHours(0, 0, 0, 0);
  const t = solar.century(date);
  const longitude = ((day - date) / 864e5) * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
};

export { Globe };
