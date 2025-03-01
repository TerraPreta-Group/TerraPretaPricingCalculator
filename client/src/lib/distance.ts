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
      console.log('Calculating distance for town:', destination);
    } else {
      // LSD coordinates
      const coords = lsdToLatLong(destination);
      console.log('LSD input:', destination);
      console.log('Converted LSD coordinates:', coords);

      if (!coords) {
        console.error('Failed to convert LSD coordinates:', destination);
        throw new Error('Invalid LSD coordinates');
      }

      // Adjusted bounds to match actual Alberta territory including all meridians
      if (coords.lat < 49.0 || coords.lat > 60.0 || 
          coords.lng < -120.0 || coords.lng > -109.0) {
        console.error('Coordinates outside Alberta bounds:', coords);
        throw new Error('Calculated coordinates outside Alberta bounds');
      }

      apiEndpoint = `/api/distance/coordinates/${coords.lat.toFixed(6)}/${coords.lng.toFixed(6)}`;
    }

    const response = await fetch(apiEndpoint);

    if (!response.ok) {
      console.error('Distance API HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: apiEndpoint
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Distance API response:', {
      endpoint: apiEndpoint,
      response: data
    });

    if ('error' in data) {
      console.error('Distance API returned error:', data.error);
      throw new Error(data.error);
    }

    const { distance } = distanceResponseSchema.parse(data);
    return distance;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 0;
  }
}