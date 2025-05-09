import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppType } from 'server';
import { hc } from 'hono/client';

// TODO: put these utils somewhere more visible and organized

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @param units the length in terms of globe radius units that will be converted
 * @param globeRadius the arbitrary value of the globe's radius, by default it is 100 according to three.js
 * @returns the units converted to meters
 */
export function convertGRUsToMeters(units: number, globeRadius = 100) {
  // https://gscommunitycodes.usf.edu/geoscicommunitycodes/public/geophysics/Gravity/earth_shape.php
  const earthRadiusInMeters = 6378137;

  return units * earthRadiusInMeters;
}

/**
 * @returns a hono client to make type-safe requests to the API server
 */
export function honoClient() {
  return hc<AppType>('http://localhost:3001');
}
