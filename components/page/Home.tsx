// components\page\Home.tsx

import { AddReasonForm } from '@components/section/AddReasonForm';
import { Globe } from '@components/section/Globe';
import { Button } from '@components/ui/button';
import {
  useState,
  type WheelEvent,
  type TouchEvent,
  useEffect,
  useRef,
} from 'react';

function Home({
  submitCallback,
}: { submitCallback: Parameters<typeof AddReasonForm>[0]['submitCallback'] }) {
  /**
   * Scroll controller
   *
   * When the component mounts, scrollPos is at 100, and reduces to 0 as the user scrolls down.
   *
   * Range: [0, 100]
   */
  const [scrollPos, setScrollPos] = useState<number>(100);
  const lastTouchY = useRef<number | null>(null);
  const [allowGlobeInteraction, setAllowGlobeInteraction] =
    useState<boolean>(false);

  const animationFrameId = useRef<number | null>(null);

  /**
   * gradually brings scrollPos back to its initial value using a linear or cubic
   * ease-in-out animation.
   *
   * returns early when scrollPos is already 100 to prevent unexpected behavior
   */
  const resetScroll = (movement: 'linear' | 'ease' = 'ease') => {
    if (scrollPos === 100) return;

    // if an animation is already running, cancel it
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    const startPos = scrollPos;
    const endPos = 100;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const animationDuration = 1000; // milliseconds
      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / animationDuration, 1); // Ensure progress doesn't exceed 1

      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      };

      let newPos: number;

      console.log(`movement is ${movement}`);
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

      setScrollPos(newPos);

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

  const handleScrollDelta = (delta: number, sensitivity = 0.06) => {
    const changeAmount = delta * sensitivity;

    setScrollPos((prevPos) => {
      const newPos = prevPos - changeAmount;
      return Math.max(0, Math.min(100, newPos)); // clamp the value between 0 and 100
    });
  };

  /**
   * when scrollPos becomes 0, start a timer. If the timer completes, allow the
   * user to interact with the globe.
   *
   * Intended to "debounce" scroll inputs to prevent the user from zooming way
   * out on the globe by continuing to scroll after scrollPos becomes 0, which
   * is a pretty common case.
   */
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (scrollPos === 0) {
      timerId = setTimeout(() => {
        setAllowGlobeInteraction(true);
      }, 1000); // 1 second
    } else {
      // If scrollPos is not 0, disallow globe interaction immediately
      // This also handles cases where scrollPos moves away from 0 before the timer finishes
      setAllowGlobeInteraction(false);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [scrollPos]);

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
  const titlePosition = `calc(${2 + 0.48 * scrollPos}% - ${1.5 * scrollPos}px)`;

  /**
   * Calculate the blur amount based on scrollPos using linear interpolation.
   *
   * When scrollPos is 0, blur is 0px.
   * When scrollPos is 100, blur is 2px (full strength).
   */
  const blurAmount = 0.02 * scrollPos;

  const scrollAnimationKeyframes = `
  @keyframes scrollUpDown {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

  return (
    <>
      <div
        data-testid={'home-root-element'}
        className="h-screen w-screen flex place-items-center justify-center flex-col gap-4 relative z-10"
        style={{
          backdropFilter: `blur(${blurAmount}px)`,
          pointerEvents:
            scrollPos === 0 && allowGlobeInteraction ? 'none' : 'auto',
        }}
        onWheel={(e: WheelEvent<HTMLDivElement>) => {
          handleScrollDelta(e.deltaY);
        }}
        onTouchStart={(e: TouchEvent<HTMLDivElement>) => {
          if (e.touches.length > 0) {
            lastTouchY.current = e.touches[0].clientY;
          }
        }}
        onTouchMove={(e: TouchEvent<HTMLDivElement>) => {
          // Only process if a touch started and we have a last recorded position
          if (e.touches.length > 0 && lastTouchY.current !== null) {
            const currentTouchY = e.touches[0].clientY;
            const deltaY = currentTouchY - lastTouchY.current;

            // handleScrollPos(deltaY * -1);
            handleScrollDelta(deltaY * -1, 1);

            lastTouchY.current = currentTouchY;
          }
        }}
        onTouchEnd={() => {
          lastTouchY.current = null;
        }}
      >
        <h1
          data-testid="home-title"
          className="absolute"
          style={{ top: titlePosition, textAlign: 'center' }}
        >
          What is your favorite thing about Earth?
        </h1>
        <div
          data-testid="home-form"
          className="w-[80%] max-w-[800px]"
          style={{
            opacity: scrollPos / 100,
            display: scrollPos > 0 ? 'initial' : 'none',
          }}
        >
          <AddReasonForm
            submitCallback={submitCallback}
            focusHandler={() => resetScroll()}
          />
        </div>
        <style>{scrollAnimationKeyframes}</style>
        <p
          data-testid="home-title"
          className="absolute text-slate-600 font-light"
          style={{
            bottom: '1%',
            opacity: scrollPos / 100,
            display: scrollPos > 0 ? 'initial' : 'none',
            // TODO: figure out why this is waiting 10s on mount, then looping every 1s instead of looping every 10s
            //   animation: 'scrollUpDown 1s cubic-bezier(0.7, 0, 0.3, 1) 10s infinite'
          }}
        >
          scroll down
        </p>
      </div>
      <div id="home-globe" className="absolute flex inset-0 z-0">
        <Globe interactive={allowGlobeInteraction} />
        <Button
          style={{
            position: 'absolute',
            bottom: '1%',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: scrollPos === 0 && allowGlobeInteraction ? 1 : 0,
            // make the button fade in
            transition: 'opacity 0.5s ease-in-out',
            // make fade out instant
            visibility: scrollPos === 0 ? 'visible' : 'hidden',
          }}
          onClick={() => resetScroll()}
        >
          Return Home
        </Button>
      </div>
    </>
  );
}

export { Home };
