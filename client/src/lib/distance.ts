import { z } from "zod";

const distanceResponseSchema = z.object({
  distance: z.number(),
});

export async function calculateDistance(destination: string): Promise<number> {
  try {
    const response = await fetch(
      `/api/distance/${encodeURIComponent(destination)}`
    );

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