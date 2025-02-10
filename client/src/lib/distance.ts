import { z } from "zod";
import { type LSDCoordinates, lsdToLatLong } from "./lsd";

const distanceResponseSchema = z.object({
  distance: z.number(),
});

export async function calculateDistance(destination: string | LSDCoordinates): Promise<number> {
  try {
    let apiEndpoint: string;

    if (typeof destination === 'string') {
      // Town name lookup
      apiEndpoint = `/api/distance/${encodeURIComponent(destination)}`;
    } else {
      // LSD coordinates
      const coords = lsdToLatLong(destination);
      console.log('Converted LSD coordinates:', coords);

      if (!coords) {
        throw new Error('Invalid LSD coordinates');
      }
      apiEndpoint = `/api/distance/coordinates/${coords.lat}/${coords.lng}`;
    }

    console.log('Calling distance API endpoint:', apiEndpoint);
    const response = await fetch(apiEndpoint);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Distance API response:", data);

    const { distance } = distanceResponseSchema.parse(data);
    return distance;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 0;
  }
}