import { z } from "zod";

// Constants for the Alberta Township System (ATS)
const TOWNSHIP_HEIGHT = 0.0972; // Degrees latitude per township (approximately 6 miles)
const RANGE_WIDTH = 0.1428571; // Degrees longitude per range (approximately 6 miles at 49°N)

// Alberta bounds
const ALBERTA_BOUNDS = {
  lat: { min: 49.0, max: 60.0 },
  lng: { min: -120.0, max: -110.0 }
};

export function lsdToLatLong(coords: LSDCoordinates): { lat: number; lng: number } | null {
  try {
    // Parse and validate inputs
    const township = parseInt(coords.township);
    const range = parseInt(coords.range);
    const section = parseInt(coords.section);
    const lsd = parseInt(coords.lsd);
    const meridian = coords.meridian;

    // Validate input ranges
    if (isNaN(township) || township < 1 || township > 126 ||
        isNaN(range) || range < 1 || range > 34 ||
        isNaN(section) || section < 1 || section > 36 ||
        isNaN(lsd) || lsd < 1 || lsd > 16) {
      console.error('Invalid LSD values:', coords);
      return null;
    }

    // Calculate latitude based on township, section, and LSD
    const baseLat = 49.0;
    const latFromTownship = baseLat + ((township - 1) * TOWNSHIP_HEIGHT);
    const sectionRow = Math.floor((section - 1) / 6);
    const lsdRow = Math.floor((lsd - 1) / 4);
    const finalLat = latFromTownship - 
                     (sectionRow * (TOWNSHIP_HEIGHT / 6)) - 
                     (lsdRow * (TOWNSHIP_HEIGHT / 24));

    // Calculate longitude based on meridian and range
    let baseLng;
    let rangeDirection;

    switch (meridian) {
      case 'W4':
        baseLng = -110.0;
        rangeDirection = 1;  // Ranges increase westward
        break;
      case 'W5':
        baseLng = -114.0;
        // For W5: Ranges 1-17 go east, 18+ go west
        rangeDirection = range <= 17 ? -1 : 1;
        break;
      case 'W6':
        baseLng = -118.0;
        rangeDirection = -1;  // Ranges increase eastward
        break;
      default:
        console.error('Invalid meridian:', meridian);
        return null;
    }

    // Apply latitude correction factor to range width
    const latCorrection = Math.cos(finalLat * Math.PI / 180);
    const adjustedRangeWidth = RANGE_WIDTH * latCorrection;

    // Calculate range offset
    let rangeOffset;
    if (meridian === 'W5' && range > 17) {
      // Special handling for ranges west of W5
      rangeOffset = (range - 17) * adjustedRangeWidth;
    } else {
      rangeOffset = (range - 1) * adjustedRangeWidth * rangeDirection;
    }

    // Calculate section and LSD offsets for longitude
    const sectionCol = ((section - 1) % 6);
    const lsdCol = ((lsd - 1) % 4);
    const sectionLngOffset = (sectionCol * adjustedRangeWidth / 6);
    const lsdLngOffset = (lsdCol * adjustedRangeWidth / 24);

    // Calculate final longitude
    const finalLng = baseLng + rangeOffset + 
                    (rangeDirection * (sectionLngOffset + lsdLngOffset));

    // Debug logging
    console.log('LSD Calculation Details:', {
      input: coords,
      baseCoordinates: { lat: baseLat, lng: baseLng },
      latitudeCalculation: {
        fromTownship: latFromTownship,
        sectionOffset: sectionRow * (TOWNSHIP_HEIGHT / 6),
        lsdOffset: lsdRow * (TOWNSHIP_HEIGHT / 24),
        final: finalLat
      },
      longitudeCalculation: {
        rangeDirection,
        latCorrection,
        adjustedRangeWidth,
        rangeOffset,
        sectionOffset: sectionLngOffset,
        lsdOffset: lsdLngOffset,
        final: finalLng
      }
    });

    // Validate coordinates
    if (finalLat < ALBERTA_BOUNDS.lat.min || finalLat > ALBERTA_BOUNDS.lat.max ||
        finalLng < ALBERTA_BOUNDS.lng.min || finalLng > ALBERTA_BOUNDS.lng.max) {
      console.error('Coordinates outside Alberta bounds:', { lat: finalLat, lng: finalLng });
      return null;
    }

    return { lat: finalLat, lng: finalLng };
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