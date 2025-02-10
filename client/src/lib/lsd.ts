import { z } from "zod";

// Constants for the Alberta Township System (ATS)
const TOWNSHIP_HEIGHT = 0.0972; // Degrees latitude per township (approximately 6 miles)
const RANGE_WIDTH_BASE = 0.125; // Base width at 49°N (gets narrower as you go north)

// Alberta bounds (adjusted for complete coverage)
const ALBERTA_BOUNDS = {
  lat: { min: 48.9, max: 60.1 },
  lng: { min: -120.1, max: -109.0 }  // Adjusted to include all of W4 territory
};

// Base coordinates for meridians in Alberta (adjusted for accuracy)
const meridianBase = {
  'W4': { lat: 49.0, lng: -110.0 }, // Fourth Meridian (AB/SK border)
  'W5': { lat: 49.0, lng: -114.0 }, // Fifth Meridian
  'W6': { lat: 49.0, lng: -118.0 }  // Sixth Meridian
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

    // Calculate township offset (moving north)
    const townshipOffset = (township - 1) * TOWNSHIP_HEIGHT;
    const finalLat = base.lat + townshipOffset;

    // Adjust range width based on latitude (gets narrower as you go north)
    const latitudeFactor = Math.cos(finalLat * Math.PI / 180);
    const adjustedRangeWidth = RANGE_WIDTH_BASE * latitudeFactor;

    // Calculate range offset based on meridian
    let rangeOffset = 0;
    switch (coords.meridian) {
      case 'W4':
        // Ranges increase westward from 110°W
        rangeOffset = (range - 1) * adjustedRangeWidth;
        break;
      case 'W5':
        // Ranges increase both ways from 114°W
        rangeOffset = range <= 17 
          ? -(range - 1) * adjustedRangeWidth  // East of W5
          : (range - 17) * adjustedRangeWidth; // West of W5
        break;
      case 'W6':
        // Ranges increase eastward from 118°W
        rangeOffset = -(range - 1) * adjustedRangeWidth;
        break;
    }

    // Calculate section offset within township (6x6 grid)
    const sectionRow = Math.ceil(section / 6) - 1;
    const sectionCol = (section - 1) % 6;
    const sectionOffset = {
      lng: sectionCol * (adjustedRangeWidth / 6),
      lat: -(sectionRow * (TOWNSHIP_HEIGHT / 6))
    };

    // Calculate LSD offset within section (4x4 grid)
    const lsdRow = Math.ceil(lsd / 4) - 1;
    const lsdCol = (lsd - 1) % 4;
    const lsdOffset = {
      lng: lsdCol * (adjustedRangeWidth / 24),
      lat: -(lsdRow * (TOWNSHIP_HEIGHT / 24))
    };

    // Calculate final coordinates
    const finalLng = base.lng + rangeOffset + sectionOffset.lng + lsdOffset.lng;
    const finalLatWithOffsets = finalLat + sectionOffset.lat + lsdOffset.lat;

    console.log('LSD Coordinate Calculation:', {
      input: coords,
      base,
      offsets: {
        township: townshipOffset,
        range: rangeOffset,
        section: sectionOffset,
        lsd: lsdOffset
      },
      result: { lat: finalLatWithOffsets, lng: finalLng }
    });

    // Validate final coordinates are within Alberta's bounds
    if (finalLatWithOffsets < ALBERTA_BOUNDS.lat.min || finalLatWithOffsets > ALBERTA_BOUNDS.lat.max || 
        finalLng < ALBERTA_BOUNDS.lng.min || finalLng > ALBERTA_BOUNDS.lng.max) {
      console.error('Calculated coordinates outside Alberta bounds:', 
        { lat: finalLatWithOffsets, lng: finalLng });
      return null;
    }

    return { lat: finalLatWithOffsets, lng: finalLng };
  } catch (error) {
    console.error('Error converting LSD coordinates:', error);
    return null;
  }
}

export function formatLSDLocation(coords: LSDCoordinates): string {
  return `${coords.lsd}-${coords.section}-${coords.township}-${coords.range} ${coords.meridian}`;
}

export interface LSDCoordinates {
  lsd: string;
  section: string;
  township: string;
  range: string;
  meridian: string;
}