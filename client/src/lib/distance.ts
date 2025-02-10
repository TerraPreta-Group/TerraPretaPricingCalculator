import { z } from "zod";

const SUNDRE_LOCATION = "Sundre, AB, Canada";

export const distanceResponseSchema = z.object({
  status: z.string(),
  rows: z.array(
    z.object({
      elements: z.array(
        z.object({
          status: z.string(),
          distance: z.object({
            text: z.string(),
            value: z.number(),
          }),
          duration: z.object({
            text: z.string(),
            value: z.number(),
          }),
        })
      ),
    })
  ),
});

export async function calculateDistance(destination: string): Promise<number> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        SUNDRE_LOCATION
      )}&destinations=${encodeURIComponent(
        destination
      )}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch distance");
    }

    const data = await response.json();
    const parsed = distanceResponseSchema.parse(data);

    if (
      parsed.status === "OK" &&
      parsed.rows[0].elements[0].status === "OK"
    ) {
      // Convert meters to kilometers
      return parsed.rows[0].elements[0].distance.value / 1000;
    }

    throw new Error("Could not calculate distance");
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 0;
  }
}
