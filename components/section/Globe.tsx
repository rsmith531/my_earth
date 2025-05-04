import { useEffect, useRef, useState } from 'react';
import UnderGlobe, { type GlobeMethods } from 'react-globe.gl';

// https://thenewstack.io/recreating-shopifys-bfcm-globe-using-react-globe-gl/

function Globe({ interactive }: { interactive: boolean }) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [verticalOffset, setVerticalOffset] = useState<number>(0);

  /**
   * when the component mounts, set it to autorotate the globe
   */
  useEffect(() => {
    if (!globeEl?.current) return;
    globeEl.current.controls().autoRotate = autoSpin;
    globeEl.current.controls().autoRotateSpeed = 0.1;
  }, [autoSpin]);

  // TODO: move the globe into the middle of the screen on interactive smoothly
  /**
   * makes the globe start spinning again when the view is reset
   */
  useEffect(() => {
    if (!interactive) {
      setAutoSpin(true);
      globeEl?.current?.pointOfView({ altitude: 2 }, 1000);
    }
    toggleVerticalOffset();
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

    const startPos = verticalOffset;
    const endPos = verticalOffset === 0 ? 500 : 0;
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

  return (
    <div data-testid={'globe-root-element'} className="cursor-move">
      <UnderGlobe
        // disable autorotate when the user clicks the globe
        onGlobeClick={() => setAutoSpin(false)}
        ref={globeEl}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        globeOffset={[0, verticalOffset]}
        backgroundColor="#00000000" // transparent
      />
    </div>
  );
}

export { Globe };
