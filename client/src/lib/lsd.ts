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

    // Base coordinates for different meridians in Alberta (refined values)
    const meridianBase = {
      'W4': { lat: 49.0, lng: -110.0 },
      'W5': { lat: 49.0, lng: -114.0 },
      'W6': { lat: 49.0, lng: -118.0 }
    };

    if (!meridianBase[coords.meridian as keyof typeof meridianBase]) {
      return null;
    }

    const base = meridianBase[coords.meridian as keyof typeof meridianBase];

    // Constants for precise calculations
    const TOWNSHIP_HEIGHT = 0.0625; // Degrees per township (approximately 6 miles)
    const RANGE_WIDTH = 0.0833; // Degrees per range (approximately 6 miles at 49°N)
    const SECTION_HEIGHT = TOWNSHIP_HEIGHT / 6;
    const SECTION_WIDTH = RANGE_WIDTH / 6;
    const LSD_HEIGHT = SECTION_HEIGHT / 4;
    const LSD_WIDTH = SECTION_WIDTH / 4;

    // Calculate latitude components
    const townshipLat = township * TOWNSHIP_HEIGHT;
    const sectionLat = ((Math.floor((section - 1) / 6)) * SECTION_HEIGHT) + 
                      ((Math.floor((lsd - 1) / 4)) * LSD_HEIGHT);

    // Calculate longitude components
    const rangeLng = range * RANGE_WIDTH;
    const sectionLng = ((section - 1) % 6) * SECTION_WIDTH +
                      ((lsd - 1) % 4) * LSD_WIDTH;

    // Combine all components
    return {
      lat: base.lat + townshipLat + sectionLat,
      lng: base.lng + rangeLng + sectionLng
    };
  } catch (error) {
    console.error('Error converting LSD to coordinates:', error);
    return null;
  }
}