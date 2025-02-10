import { z } from "zod";

export interface LSDCoordinates {
  lsd: string;
  section: string;
  township: string;
  range: string;
  meridian: string;
}

export function formatLSDLocation(coords: LSDCoordinates): string {
  console.log("Formatting LSD Coordinates:", coords);
  return `${coords.lsd}-${coords.section}-${coords.township}-${coords.range} ${coords.meridian}`;
}

// Constants for the Alberta Township System (ATS)
// Each township is approximately 6 miles (9.7 km) square
const TOWNSHIP_HEIGHT = 0.0833; // Degrees latitude per township (roughly 6 miles)
const RANGE_WIDTH = 0.0972; // Degrees longitude per range at ~52°N (Alberta's middle latitude)

export function lsdToLatLong(coords: LSDCoordinates): { lat: number; lng: number } | null {
  try {
    console.log("Converting LSD coordinates:", coords);

    // Parse and validate inputs
    const township = parseInt(coords.township);
    const range = parseInt(coords.range);
    const section = parseInt(coords.section);
    const lsd = parseInt(coords.lsd);

    // Validate input ranges
    if (isNaN(township) || township < 1 || township > 126 ||
        isNaN(range) || range < 1 || range > 34 ||
        isNaN(section) || section < 1 || section > 36 ||
        isNaN(lsd) || lsd < 1 || lsd > 16) {
      console.error('Invalid LSD values:', coords);
      return null;
    }

    // Base coordinates for meridians in Alberta
    const meridianBase = {
      'W4': { lat: 49.0, lng: -110.0 }, // Fourth Meridian
      'W5': { lat: 49.0, lng: -115.0 }, // Fifth Meridian (corrected)
      'W6': { lat: 49.0, lng: -118.0 }  // Sixth Meridian
    };

    if (!meridianBase[coords.meridian as keyof typeof meridianBase]) {
      console.error('Invalid meridian:', coords.meridian);
      return null;
    }

    // Get base coordinates for the specified meridian
    const base = meridianBase[coords.meridian as keyof typeof meridianBase];

    // Calculate section position (1-36)
    const sectionRow = Math.floor((section - 1) / 6);
    const sectionCol = (section - 1) % 6;

    // Calculate LSD position (1-16)
    const lsdRow = Math.floor((lsd - 1) / 4);
    const lsdCol = (lsd - 1) % 4;

    // Calculate final coordinates with corrected constants
    const finalLat = base.lat + 
      (township - 1) * TOWNSHIP_HEIGHT + // Township offset
      sectionRow * (TOWNSHIP_HEIGHT / 6) + // Section offset
      lsdRow * (TOWNSHIP_HEIGHT / 24); // LSD offset

    const finalLng = base.lng + 
      (range - 1) * RANGE_WIDTH + // Range offset
      sectionCol * (RANGE_WIDTH / 6) + // Section offset
      lsdCol * (RANGE_WIDTH / 24); // LSD offset

    // Log detailed calculation steps
    console.log('LSD Coordinate Calculation:', {
      input: coords,
      base: base,
      constants: {
        TOWNSHIP_HEIGHT,
        RANGE_WIDTH
      },
      offsets: {
        township: (township - 1) * TOWNSHIP_HEIGHT,
        section: {
          row: sectionRow * (TOWNSHIP_HEIGHT / 6),
          col: sectionCol * (RANGE_WIDTH / 6)
        },
        lsd: {
          row: lsdRow * (TOWNSHIP_HEIGHT / 24),
          col: lsdCol * (RANGE_WIDTH / 24)
        }
      },
      result: { lat: finalLat, lng: finalLng }
    });

    // Validate final coordinates are within Alberta bounds
    if (finalLat < 49 || finalLat > 60 || finalLng < -120 || finalLng > -110) {
      console.error('Calculated coordinates outside Alberta bounds:', { lat: finalLat, lng: finalLng });
      return null;
    }

    return { lat: finalLat, lng: finalLng };
  } catch (error) {
    console.error('Error converting LSD to coordinates:', error);
    return null;
  }
}