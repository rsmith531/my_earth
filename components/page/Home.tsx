import { AddReasonForm } from '@components/section/AddReasonForm';
import { useState, type WheelEvent } from 'react';

function Home() {
  /**
   * Scroll controller
   *
   * When the component mounts, scrollPos is at 100, and reduces to 0 as the user scrolls down.
   *
   * Range: [0, 100]
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

  /**
   * Calculate the position of the title based on scrollPos to adjust it with linear interpolation.
   *
   * When scrollPos is 100, position is calc(50% - 96px), which is just above the home-form element.
   * When scrollPos is 0, position is 2%, which is just below the top edge of home-root-element.
   *
   * Percentage component: interpolates from 2% to 50%.
   * Starts at 2%, adds (scrollPos / 100) * (50 - 2)% = 0.48 * scrollPos %
   * Total percentage: (2 + 0.48 * scrollPos)%
   *
   * Pixel component: interpolates from 0px to -96px.
   * Starts at 0px, adds (scrollPos / 100) * (-96 - 0)px = -0.96 * scrollPos px
   * Total pixel offset: -0.96 * scrollPos px
   */
  const titlePosition = `calc(${2 + 0.48 * scrollPos}% - ${0.96 * scrollPos}px)`;

  /**
   * Calculate the blur amount based on scrollPos using linear interpolation.
   *
   * When scrollPos is 0, blur is 0px.
   * When scrollPos is 100, blur is 2px (full strength).
   */
  const blurAmount = 0.02 * scrollPos;

  const scrollAnimationKeyframes = `
  @keyframes scrollUpDown {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px); /* Move up 20px */
    }
    100% {
      transform: translateY(0);
    }
  }
`;

  return (
    <div
      data-testId={'home-root-element'}
      className="h-screen w-screen flex place-items-center justify-center flex-col gap-4 relative"
      style={{ backdropFilter: `blur(${blurAmount}px)` }}
      onWheel={handleScroll}
    >
      <h1
        data-testId="home-title"
        className="absolute"
        style={{ top: titlePosition }}
      >
        What is your favorite thing about Earth?
      </h1>
      <div
        data-testId="home-form"
        className="w-[80%]"
        style={{
          opacity: scrollPos / 100,
          display: scrollPos ? 'initial' : 'none',
        }}
      >
        <AddReasonForm submitCallback={async (values) => console.log(values)} />
      </div>
      <style>{scrollAnimationKeyframes}</style>
      <p
        data-testId="home-title"
        className="absolute text-slate-600 font-light"
        style={{
          bottom: '1%',
          opacity: scrollPos / 100,
          display: scrollPos ? 'initial' : 'none',
          // TODO: figure out why this is waiting 10s on mount, then looping every 1s instead of looping every 10s
          //   animation: 'scrollUpDown 1s cubic-bezier(0.7, 0, 0.3, 1) 10s infinite'
        }}
      >
        scroll down
      </p>
    </div>
  );
}

export { Home };
