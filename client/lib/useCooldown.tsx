// lib\useCooldown.tsx

import { useEffect, useRef, useState } from 'react';

// TODO: write unit tests for this hook

/**
 * infrastructure to disable the submit button for a specified cooldown period after a successful form submission
 */

const localStorageKey = 'cooldownEndTime';
const initialCooldownDuration = 5 * 1000; // Initial cooldown: 5 seconds
const multiplier = 2; // Factor to multiply duration by each time
const maxCooldownDuration = 5 * 60 * 1000; // Maximum cooldown: 5 minutes

/**
 * Custom hook to manage a time-based exponential backoff cooldown. It persists
 * in local storage so the user can't attempt to avoid the cooldown by reloading
 * the page. The backoff level increases with each triggered cooldown.
 *
 * @returns An object containing the remaining cooldown seconds and a function
 * to start the cooldown.
 */
function useCooldown(): {
  remainingCooldownSeconds: number | null;
  startCooldown: () => void;
} {
  const [remainingCooldownSeconds, setRemainingCooldownSeconds] = useState<
    number | null
  >(null);
  const [currentBackoffLevel, setCurrentBackoffLevel] = useState<number>(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDuration = (level: number): number => {
    if (level <= 1) {
      return 0; // First trigger has no cooldown
    }

    // For level 2 and above, apply exponential backoff
    const exponent = level - 2;
    const duration = initialCooldownDuration * multiplier ** exponent;

    // if the calculated duration exceeds the max allowed, just return the max
    // allowed
    return Math.min(duration, maxCooldownDuration);
  };

  // initialize cooldown state from localStorage on mount
  useEffect(() => {
    const storedState = localStorage.getItem(localStorageKey);
    if (storedState) {
      const { level, endTime } = JSON.parse(storedState);
      const remainingTime = Number.parseInt(endTime, 10) - Date.now();

      if (remainingTime > 0) {
        // Valid cooldown found, set initial seconds. This will trigger the
        // interval effect below.
        setRemainingCooldownSeconds(Math.ceil(remainingTime / 1000));
        setCurrentBackoffLevel(level);
      } else {
        // Invalid or expired entry
        localStorage.removeItem(localStorageKey);
        setRemainingCooldownSeconds(null);
        setCurrentBackoffLevel(0);
      }
    } else {
      // No cooldown entry found
      setRemainingCooldownSeconds(null);
      setCurrentBackoffLevel(0);
    }
  }, []);

  // manage the countdown interval based on remainingCooldownSeconds state
  useEffect(() => {
    // Clear any existing interval when this effect runs or cleans up
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }

    // Start interval ONLY if remainingCooldownSeconds is a positive number
    if (remainingCooldownSeconds !== null && remainingCooldownSeconds > 0) {
      const tick = () => {
        // Check the actual end time from localStorage on each tick for accuracy
        // This also handles cases where localStorage might be cleared
        // externally
        const storedState = localStorage.getItem(localStorageKey);
        if (!storedState) {
          console.warn('Cooldown ended unexpectedly (localStorage missing).');
          setRemainingCooldownSeconds(null);
          setCurrentBackoffLevel(0);
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          return;
        }

        const { endTime } = JSON.parse(storedState);
        const remainingTime = Number.parseInt(endTime, 10) - Date.now();

        if (remainingTime <= 0) {
          setRemainingCooldownSeconds(null);
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
        } else {
          setRemainingCooldownSeconds(Math.ceil(remainingTime / 1000));
        }
      };

      cooldownIntervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [remainingCooldownSeconds]);

  function startCooldown() {
    const newLevel = currentBackoffLevel + 1;
    setCurrentBackoffLevel(newLevel);

    const duration = calculateDuration(newLevel);
    const endTime = Date.now() + duration;
    try {
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          level: newLevel,
          endTime: endTime,
        }),
      );
      // Set initial seconds - the interval effect will handle the countdown
      setRemainingCooldownSeconds(Math.ceil(duration / 1000));
    } catch (error) {
      console.error('Failed to set cooldown in localStorage:', error);
      // If storage fails, ensure cooldown state is off
      setRemainingCooldownSeconds(null);
      setCurrentBackoffLevel(0);
      localStorage.removeItem(localStorageKey);
    }
  }
  return {
    remainingCooldownSeconds,
    startCooldown,
  };
}

export { useCooldown };
