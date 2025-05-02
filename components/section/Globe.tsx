import UnderGlobe from 'react-globe.gl';

// https://thenewstack.io/recreating-shopifys-bfcm-globe-using-react-globe-gl/

function Globe({ position }: { position: number }) {
  return (
    <div
      data-testId={'globe-root-element'}
      //   className="h-screen w-screen flex place-items-center justify-center flex-col gap-4"
      className="cursor-move"
    >
      <UnderGlobe
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        globeOffset={[0, 500]}
        backgroundColor="#00000000"
      />
    </div>
  );
}

export { Globe };
