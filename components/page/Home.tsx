import { AddReasonForm } from '@components/section/AddReasonForm';
import { useState, useEffect, useRef, type WheelEvent } from 'react';

function Home() {
  /**
   * scroll controller infrastructure ~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~
   */
  const [scrollPos, setScrollPos] = useState<number>(100);
  const handleScroll = (e: WheelEvent<HTMLDivElement>) => {
    console.log('[Home] scrolled', e.deltaY);
    switch (Math.sign(e.deltaY)) {
      case 1: {
        // scrolling down
        setScrollPos((prevPos) => Math.max(0, prevPos - 1));
        break;
      }
      case -1: {
        // scrolling up
        setScrollPos((prevPos) => Math.min(100, prevPos + 1));
        break;
      }
      case 0: {
        // being a user
        console.warn(`[Home] e.deltaY was ${e.deltaY}`);
        break;
      }
      default: {
        // wut?
        console.error(`[Home] how tho? ${e.deltaY}`);
        break;
      }
    }
    console.log(`[Home] scrollPos is ${scrollPos}`);
  };

  const titlePosition = -18 * 4 - (100 - scrollPos) * 4;

  return (
    <div
      data-testId={'home-root-element'}
      className="h-screen flex place-items-center justify-center flex-col gap-4"
      style={{ backdropFilter: 'blur(2px)' }}
      onWheel={handleScroll}
    >
      <h1
        data-testId="home-title"
        className="relative"
        style={{ top: `${titlePosition}px` }}
      >
        What is your favorite thing about Earth?
      </h1>
      <div
        data-testId="home-form"
        className="w-[80%] absolute"
        style={{
          opacity: scrollPos / 100,
          display: scrollPos ? 'initial' : 'none',
        }}
      >
        <AddReasonForm submitCallback={async (values) => console.log(values)} />
      </div>
    </div>
  );
}

export { Home };
