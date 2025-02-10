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

export function lsdToLatLong(coords: LSDCoordinates): { lat: number; lng: number } | null {
  try {
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

    // Calculate section position within township (1-36)
    const sectionRow = Math.floor((section - 1) / 6); // 0-5
    const sectionCol = (section - 1) % 6; // 0-5

    // Calculate LSD position within section (1-16)
    const lsdRow = Math.floor((lsd - 1) / 4); // 0-3
    const lsdCol = (lsd - 1) % 4; // 0-3

    // Constants for coordinate calculations (refined values)
    const TOWNSHIP_HEIGHT = 0.0571428; // 6 miles in degrees latitude
    const RANGE_WIDTH = 0.0666667; // 6 miles in degrees longitude

    // Calculate final coordinates
    const finalLat = base.lat + 
                    (township - 1) * TOWNSHIP_HEIGHT + // Township offset
                    sectionRow * (TOWNSHIP_HEIGHT / 6) + // Section row offset
                    lsdRow * (TOWNSHIP_HEIGHT / 24); // LSD row offset

    const finalLng = base.lng + 
                    (range - 1) * RANGE_WIDTH + // Range offset
                    sectionCol * (RANGE_WIDTH / 6) + // Section column offset
                    lsdCol * (RANGE_WIDTH / 24); // LSD column offset

    // Log calculated coordinates for debugging
    console.log('LSD Coordinate Calculation:', {
      input: coords,
      parsed: { township, range, section, lsd },
      base: base,
      offsets: {
        township: (township - 1) * TOWNSHIP_HEIGHT,
        section: {
          lat: sectionRow * (TOWNSHIP_HEIGHT / 6),
          lng: sectionCol * (RANGE_WIDTH / 6)
        },
        lsd: {
          lat: lsdRow * (TOWNSHIP_HEIGHT / 24),
          lng: lsdCol * (RANGE_WIDTH / 24)
        }
      },
      final: { lat: finalLat, lng: finalLng }
    });

    return { lat: finalLat, lng: finalLng };
  } catch (error) {
    console.error('Error converting LSD to coordinates:', error);
    return null;
  }
}