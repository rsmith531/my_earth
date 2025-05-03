import { useEffect, useRef, useState } from 'react';
import UnderGlobe, { type GlobeMethods } from 'react-globe.gl';

// https://thenewstack.io/recreating-shopifys-bfcm-globe-using-react-globe-gl/

function Globe({ interactive }: { interactive: boolean }) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [verticalOffset, setVerticalOffset] = useState<number>(500);

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
      // setVerticalOffset(500);
      globeEl?.current?.pointOfView({ altitude: 2 }, 1000);
    } else {
      // setVerticalOffset(0);
    }
  }, [interactive]);

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
