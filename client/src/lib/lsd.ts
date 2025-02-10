interface LSDCoordinates {
  lsd: string;
  section: string;
  township: string;
  range: string;
  meridian: string;
}

export function formatLSDLocation(coords: LSDCoordinates): string {
  return `${coords.lsd}-${coords.section}-${coords.township}-${coords.range} ${coords.meridian}`;
}

// Convert LSD to precise lat/long coordinates
export function lsdToLatLong(coords: LSDCoordinates): { lat: number; lng: number } | null {
  try {
    const township = parseInt(coords.township);
    const range = parseInt(coords.range);
    const section = parseInt(coords.section);
    const lsd = parseInt(coords.lsd);

    // Base coordinates for different meridians in Alberta
    const meridianBase = {
      'W4': { lat: 49.0, lng: -110.0 },
      'W5': { lat: 49.0, lng: -114.0 },
      'W6': { lat: 49.0, lng: -118.0 }
    };

    if (!meridianBase[coords.meridian as keyof typeof meridianBase]) {
      console.error('Invalid meridian:', coords.meridian);
      return null;
    }

    const base = meridianBase[coords.meridian as keyof typeof meridianBase];

    // Constants for precise calculations
    const TOWNSHIP_HEIGHT = 0.0571428; // Approximately 6 miles north-south
    const RANGE_WIDTH = 0.0666667; // Approximately 6 miles east-west at base latitude

    // Calculate section position (1-36)
    const sectionRow = Math.floor((section - 1) / 6);
    const sectionCol = (section - 1) % 6;

    // Calculate LSD position within section (1-16)
    const lsdRow = Math.floor((lsd - 1) / 4);
    const lsdCol = (lsd - 1) % 4;

    // Final position calculation
    const lat = base.lat + 
                (township * TOWNSHIP_HEIGHT);

    const lng = base.lng -
                (range * RANGE_WIDTH);

    // Add section and LSD offsets
    const finalLat = lat + 
                    (sectionRow * TOWNSHIP_HEIGHT / 6) +
                    (lsdRow * TOWNSHIP_HEIGHT / 24);

    const finalLng = lng + 
                    (sectionCol * RANGE_WIDTH / 6) +
                    (lsdCol * RANGE_WIDTH / 24);

    console.log('LSD to Coordinates:', {
      input: coords,
      base: base,
      calculated: { lat: finalLat, lng: finalLng }
    });

    return { lat: finalLat, lng: finalLng };
  } catch (error) {
    console.error('Error converting LSD to coordinates:', error);
    return null;
  }
}