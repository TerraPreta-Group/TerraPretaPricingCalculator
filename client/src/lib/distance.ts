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
      console.log('LSD input:', destination);
      console.log('Converted LSD coordinates:', coords);

      if (!coords) {
        throw new Error('Invalid LSD coordinates');
      }

      // Validate coordinates are within Alberta bounds
      if (coords.lat < 49 || coords.lat > 60 || 
          coords.lng < -120 || coords.lng > -110) {
        console.error('Coordinates outside Alberta bounds:', coords);
        throw new Error('Calculated coordinates outside Alberta bounds');
      }

      apiEndpoint = `/api/distance/coordinates/${coords.lat.toFixed(6)}/${coords.lng.toFixed(6)}`;
    }

    console.log('Calling distance API endpoint:', {
      endpoint: apiEndpoint,
      inputType: typeof destination === 'string' ? 'town' : 'lsd',
      coordinates: typeof destination === 'string' ? null : lsdToLatLong(destination)
    });
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('Distance API HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: apiEndpoint
      });
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