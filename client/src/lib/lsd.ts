import { z } from "zod";

// Constants for the Alberta Township System (ATS)
const TOWNSHIP_HEIGHT = 0.0972; // Degrees latitude per township (approximately 6 miles)
const RANGE_WIDTH_BASE = 0.125; // Base width at 49°N (gets narrower as you go north)

// Base coordinates for meridians in Alberta (adjusted for accuracy)
const meridianBase = {
  'W4': { lat: 49.0, lng: -110.0}, // Fourth Meridian
  'W5': { lat: 49.0, lng: -114.0}, // Fifth Meridian
  'W6': { lat: 49.0, lng: -118.0}  // Sixth Meridian
};

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

    // Calculate latitude
    const finalLat = base.lat + 
      (township - 1) * TOWNSHIP_HEIGHT;

    // Adjust range width based on latitude (gets narrower as you go north)
    const latitudeFactor = Math.cos(finalLat * Math.PI / 180);
    const adjustedRangeWidth = RANGE_WIDTH_BASE * latitudeFactor;

    // Calculate longitude with corrections
    const finalLng = base.lng + 
      (range - 1) * adjustedRangeWidth + // Range offset
      (sectionCol / 6) * adjustedRangeWidth + // Section offset
      (lsdCol / 24) * adjustedRangeWidth; // LSD offset

    // Log detailed calculation steps
    console.log('LSD Coordinate Calculation:', {
      input: coords,
      base: base,
      constants: {
        TOWNSHIP_HEIGHT,
        RANGE_WIDTH_BASE,
        latitudeFactor,
        adjustedRangeWidth
      },
      offsets: {
        township: (township - 1) * TOWNSHIP_HEIGHT,
        section: {
          row: sectionRow,
          col: sectionCol
        },
        lsd: {
          row: lsdRow,
          col: lsdCol
        }
      },
      result: { lat: finalLat, lng: finalLng }
    });

    // Validate final coordinates are within Alberta's bounds
    if (finalLat < 48.5 || finalLat > 60.5 || 
        finalLng < -120.5 || finalLng > -109.5) {
      console.error('Calculated coordinates outside Alberta bounds:', { lat: finalLat, lng: finalLng });
      return null;
    }

    return { lat: finalLat, lng: finalLng };
  } catch (error) {
    console.error('Error converting LSD to coordinates:', error);
    return null;
  }
}

export function formatLSDLocation(coords: LSDCoordinates): string {
  console.log("Formatting LSD Coordinates:", coords);
  return `${coords.lsd}-${coords.section}-${coords.township}-${coords.range} ${coords.meridian}`;
}

export interface LSDCoordinates {
  lsd: string;
  section: string;
  township: string;
  range: string;
  meridian: string;
}