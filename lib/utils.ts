import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

  return units * (earthRadiusInMeters / globeRadius);
}
