import { useCallback, useEffect, useRef, useState } from 'react';
import UnderGlobe, { type GlobeMethods } from 'react-globe.gl';
import { TextureLoader, ShaderMaterial, Vector2 } from 'three';
// @ts-expect-error no type :(
import * as solar from 'solar-calculator';

// https://thenewstack.io/recreating-shopifys-bfcm-globe-using-react-globe-gl/
// day/night cycle code: https://github.com/vasturiano/react-globe.gl/blob/master/example/day-night-cycle/index.html

function Globe({
  interactive,
  data,
}: {
  interactive: boolean;
  data?: { message: string; longitude: number; latitude: number }[];
}) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [verticalOffset, setVerticalOffset] = useState<number>(
    interactive ? 0 : 500,
  );
  const [globeMaterial, setGlobeMaterial] = useState<ShaderMaterial>();

  /**
   * when the component mounts, set it to autorotate the globe
   */
  useEffect(() => {
    if (!globeEl?.current) return;
    globeEl.current.controls().autoRotate = autoSpin;
    globeEl.current.controls().autoRotateSpeed = 0.1;
  }, [autoSpin]);

  const isInitialMount = useRef(true);
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
  const toggleVerticalOffset = (movement: 'linear' | 'ease' = 'ease') => {
    // if an animation is already running, cancel it
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    const startPos = interactive ? 500 : 0;
    const endPos = interactive ? 0 : 500;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const animationDuration = 1000; // milliseconds
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
        // '/earth-day.jpg',
        '/8k_earth_daymap.jpg',
        // '/8k_earth_normal_map.tif',
      ),
      new TextureLoader().loadAsync(
        // '/earth-night.jpg',
        '/8k_earth_nightmap.jpg',
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

  return (
    <div data-testid={'globe-root-element'} className="cursor-move">
      <UnderGlobe
        // disable autorotate when the user clicks the globe
        onGlobeClick={() => setAutoSpin(false)}
        globeMaterial={globeMaterial}
        ref={globeEl}
        // backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        // backgroundImageUrl="/night-sky.png"
        backgroundImageUrl="/8k_stars_milky_way.jpg"
        // backgroundImageUrl="/8k_stars.jpg"
        globeOffset={[0, verticalOffset]}
        backgroundColor="#00000000" // transparent
        onZoom={useCallback(
          ({ lng, lat }: { lng: number; lat: number }) =>
            globeMaterial?.uniforms.globeRotation.value.set(lng, lat),
          [globeMaterial],
        )}
        // html elements
        htmlElementsData={data ?? undefined}
        htmlLat={
          data
            ? (d) => {
                // @ts-expect-error don't worry, this library just has bad typing
                return d.latitude;
              }
            : undefined
        }
        htmlLng={
          data
            ? (d) => {
                // @ts-expect-error don't worry, this library just has bad typing
                return d.longitude;
              }
            : undefined
        }
        htmlElement={
          data
            ? (d): HTMLElement => {
                const element = document.createElement('div');
                // @ts-expect-error don't worry, this library just has bad typing
                element.textContent = d.message;
                element.style.textAlign = 'center';
                element.style.color = 'var(--color-slate-700)';
                element.style.maxWidth = '300px';
                element.style.backgroundColor = 'var(--color-slate-200)';
                element.style.borderRadius = '10px';
                element.style.padding = '0.25rem';
                element.style.borderColor = 'var(--color-slate-700)';
                element.style.borderWidth = '3px';
                element.style.opacity = '0.8';
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
