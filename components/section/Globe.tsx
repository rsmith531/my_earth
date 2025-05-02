import { useEffect, useRef, useState } from 'react';
import UnderGlobe, { type GlobeMethods } from 'react-globe.gl';

// https://thenewstack.io/recreating-shopifys-bfcm-globe-using-react-globe-gl/

function Globe({ position }: { position: number }) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);

  /**
   * when the component mounts, set it to autorotate the globe
   */
  useEffect(() => {
    if (!globeEl?.current) return;
    globeEl.current.controls().autoRotate = autoSpin;
    globeEl.current.controls().autoRotateSpeed = 0.1;
  }, [autoSpin]);

  /**
   * makes the globe start spinning again when the view is reset
   */
  useEffect(() => {
    if (position === 100) {
      setAutoSpin(true);
      globeEl?.current?.pointOfView({ altitude: 2 }, 1000);
    }
  }, [position]);

  return (
    <div data-testid={'globe-root-element'} className="cursor-move">
      <UnderGlobe
        // disable autorotate when the user clicks the globe
        onGlobeClick={() => setAutoSpin(false)}
        ref={globeEl}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        globeOffset={[0, 500]}
        backgroundColor="#00000000"
      />
    </div>
  );
}

export { Globe };
