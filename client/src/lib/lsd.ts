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

    // Base coordinates for different meridians in Alberta (calibrated values)
    const meridianBase = {
      'W4': { lat: 49.0, lng: -110.0012 },
      'W5': { lat: 49.0, lng: -114.0012 },
      'W6': { lat: 49.0, lng: -118.0012 }
    };

    if (!meridianBase[coords.meridian as keyof typeof meridianBase]) {
      return null;
    }

    const base = meridianBase[coords.meridian as keyof typeof meridianBase];

    // Constants for precise calculations (adjusted for Alberta's curved surface)
    const TOWNSHIP_HEIGHT = 0.0571428; // Approximately 6 miles north-south
    const RANGE_WIDTH = 0.0666667; // Approximately 6 miles east-west at base latitude

    // Adjust for earth's curvature - ranges get narrower as we go north
    const latitudeFactor = Math.cos((base.lat + township * TOWNSHIP_HEIGHT) * Math.PI / 180);
    const adjustedRangeWidth = RANGE_WIDTH / latitudeFactor;

    // Calculate section position (1-36)
    const sectionRow = Math.floor((section - 1) / 6);
    const sectionCol = (section - 1) % 6;

    // Calculate LSD position within section (1-16)
    const lsdRow = Math.floor((lsd - 1) / 4);
    const lsdCol = (lsd - 1) % 4;

    // Final position calculation
    const lat = base.lat + 
                (township * TOWNSHIP_HEIGHT) +
                (sectionRow * TOWNSHIP_HEIGHT / 6) +
                (lsdRow * TOWNSHIP_HEIGHT / 24);

    const lng = base.lng +
                (range * adjustedRangeWidth) +
                (sectionCol * adjustedRangeWidth / 6) +
                (lsdCol * adjustedRangeWidth / 24);

    return { lat, lng };
  } catch (error) {
    console.error('Error converting LSD to coordinates:', error);
    return null;
  }
}