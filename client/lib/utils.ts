// client\lib\utils.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppType } from '../../server';
import { hc } from 'hono/client';

// TODO: put these utils somewhere more visible and organized

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @param units the length in terms of globe radius units that will be converted
 * @returns the units converted to meters
 */
export function convertGRUsToMeters(units: number) {
  // https://gscommunitycodes.usf.edu/geoscicommunitycodes/public/geophysics/Gravity/earth_shape.php
  const earthRadiusInMeters = 6378137;

  return units * earthRadiusInMeters;
}

/**
 * @returns a hono client to make type-safe requests to the API server
 */
export function honoClient() {
  if (!import.meta.env.VITE_DATABASE_ENDPOINT) throw new Error('[honoClient] DATABASE_ENDPOINT is not defined')
  return hc<AppType>(import.meta.env.VITE_DATABASE_ENDPOINT);
}
