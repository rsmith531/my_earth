// components\page\Home.tsx

import { AddReasonForm } from '@components/section/AddReasonForm';
import { Globe } from '@components/section/Globe';
import { Button } from '@components/ui/button';
import { Slider } from '@components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@components/ui/tooltip';

import {
  ChevronLeft,
  ChevronRight,
  LocateOff,
  Locate,
  LocateFixed,
} from 'lucide-react';
import {
  useState,
  type WheelEvent,
  type TouchEvent,
  useEffect,
  useRef,
  type SetStateAction,
  type Dispatch,
} from 'react';

function Home({
  submitCallback,
  reportGlobeViewpoint,
  notes,
  resultsCount,
  setResultsCount,
}: {
  submitCallback: Parameters<typeof AddReasonForm>[0]['submitCallback'];
  reportGlobeViewpoint: Parameters<typeof Globe>[0]['reportViewpoint'];
  notes: Parameters<typeof Globe>[0]['data'];
  resultsCount: number;
  setResultsCount: Dispatch<SetStateAction<number>>;
}) {
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
  const [labelSide, setLabelSide] =
    useState<Parameters<typeof Slider>[0]['labelSide']>('left');

  const animationFrameId = useRef<number | null>(null);

  /**
   * gradually brings scrollPos to the opposing position out of 0 or 100 using a
   * linear or cubic ease-in-out animation.
   *
   * optionally, the animation duration can be controlled, and you can specify
   * which direction it goes in.
   *
   * returns early when scrollPos is already at the target position to prevent
   * unexpected behavior.
   */
  const toggleScroll = (
    movement: 'linear' | 'ease' = 'ease',
    animationDuration = 1000,
    explicitTarget?: 0 | 100,
  ) => {
    // If an animation is already running, cancel it
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    const startPos = scrollPos;
    let nextTarget: number;

    if (explicitTarget !== undefined) {
      nextTarget = explicitTarget;
    } else {
      nextTarget =
        Math.abs(scrollPos - 0) < Math.abs(scrollPos - 100) ? 100 : 0;
    }

    // No need to animate if we are already at the exact target
    if (startPos === nextTarget) {
      return;
    }

    const startTime = performance.now();

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    };

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const linearProgress = Math.min(elapsed / animationDuration, 1);

      let newPos: number;

      switch (movement) {
        case 'linear': {
          newPos = startPos + (nextTarget - startPos) * linearProgress;
          break;
        }
        case 'ease': {
          newPos =
            startPos + (nextTarget - startPos) * easeInOutCubic(linearProgress);
          break;
        }
        default: {
          console.error(
            `[Home/toggleScroll] unexpected value for movement: ${movement}`,
          );
          newPos = startPos;
          break;
        }
      }

      setScrollPos(newPos);

      if (linearProgress < 1) {
        animationFrameId.current = requestAnimationFrame(animateScroll);
      } else {
        setScrollPos(nextTarget);
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
      }, 400); // 0.4 second
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

  const globeRef: Parameters<typeof Globe>[0]['ref'] = useRef(null);
  const zoomOnSubmit: Parameters<typeof AddReasonForm>[0]['submitCallback'] =
    async (values) => {
      await submitCallback(values);
      if (globeRef.current && values.latitude && values.longitude) {
        globeRef.current.pointOfView(
          { lat: values.latitude, lng: values.longitude, altitude: 0.25 },
          3000,
        );
        globeRef.current.setAutoSpin(false);
        toggleScroll();
      }
    };

  /**
   * Infrastructure for finding and tracking the user's location
   */
  const [userPosition, setUserPosition] =
    useState<Parameters<typeof Globe>[0]['markerCoordinates']>(undefined);
  const [watchId, setWatchId] = useState<number | null>(null);
  const zoomedOnce = useRef<boolean>(false);
  const stopWatching = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setUserPosition(undefined);
    zoomedOnce.current = false;
  };

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
          className="absolute text-4xl"
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
            submitCallback={zoomOnSubmit}
            focusHandler={() => toggleScroll(undefined, undefined, 100)}
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
      <div id="home-globe" className="absolute flex h-dvh inset-0 z-0">
        <div className="h-full w-full">
          <Globe
            interactive={allowGlobeInteraction}
            data={notes}
            reportViewpoint={reportGlobeViewpoint}
            ref={globeRef}
            markerCoordinates={userPosition}
          />
        </div>
        <Button
          style={{
            position: 'absolute',
            bottom: '1%',
            left: '50%',
            transform: 'translateX(-50%)',
            // make the button fade in
            transition: 'opacity 0.5s ease-in-out',
            border: '2px solid var(--color-slate-200)',
          }}
          className={`
            ${scrollPos === 0 && allowGlobeInteraction ? 'opacity-30' : 'opacity-0'}
            hover:opacity-100
          `}
          onClick={() => {
            toggleScroll();
            stopWatching();
          }}
        >
          Return Home
        </Button>
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            right: labelSide === 'left' ? '5%' : undefined,
            left: labelSide === 'right' ? '5%' : undefined,
            // make the slider fade in
            transition: 'opacity 0.5s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          className={`
            ${scrollPos === 0 && allowGlobeInteraction ? 'opacity-30' : 'opacity-0'}
            hover:opacity-100
          `}
        >
          <Slider
            value={[resultsCount]}
            onValueChange={(value) => {
              setResultsCount(value[0]);
            }}
            name="Results"
            orientation="vertical"
            labelSide={labelSide}
            style={{
              border: '2px solid var(--color-slate-200)',
              borderRadius: '6px',
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  setLabelSide(labelSide === 'left' ? 'right' : 'left')
                }
                style={{
                  marginLeft: labelSide === 'left' ? 'auto' : '-14px',
                  marginRight: labelSide === 'right' ? 'auto' : '-14px',
                  border: '2px solid var(--color-slate-200)',
                }}
                className={'aspect-square w-9'}
              >
                {labelSide === 'left' ? <ChevronLeft /> : <ChevronRight />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="pb-1">Move controls to opposite side</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                style={{
                  marginLeft: labelSide === 'left' ? 'auto' : '-14px',
                  marginRight: labelSide === 'right' ? 'auto' : '-14px',
                  border: '2px solid var(--color-slate-200)',
                }}
                className={'aspect-square w-9'}
                disabled={!('geolocation' in navigator)}
                onClick={() => {
                  if (watchId) {
                    stopWatching();
                  } else {
                    const newId = navigator.geolocation.watchPosition(
                      (position) => {
                        setUserPosition({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                        });
                        if (!zoomedOnce.current) {
                          globeRef.current?.pointOfView(
                            {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude,
                              altitude: 0.25,
                            },
                            1500,
                          );
                          globeRef.current?.setAutoSpin(false);
                          zoomedOnce.current = true;
                        }
                      },
                      (error) => {
                        console.error('Geolocation error:', error);
                        stopWatching();
                      },
                    );
                    setWatchId(newId);
                  }
                }}
              >
                {!watchId && !userPosition ? (
                  <LocateOff />
                ) : watchId && !userPosition ? (
                  <Locate className="animate-pulse" />
                ) : watchId && userPosition ? (
                  <LocateFixed />
                ) : (
                  <LocateOff />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="pb-1">Zoom to your location</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

export { Home };
