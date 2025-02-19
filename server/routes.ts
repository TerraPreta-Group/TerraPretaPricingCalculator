import { sendEmail, formatOrderEmail, formatCallEmail } from "./email";
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

// Base schema for common fields
const baseContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  company: z.string().min(1, "Company name is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  message: z.string().optional(),
  reason: z.string().optional(),
  type: z.enum(["order", "call"]),
});

// Order-specific schema
const orderSchema = baseContactFormSchema.extend({
  type: z.literal("order"),
  product: z.string().optional(),
  cost: z.string().optional(),
});

// Call-specific schema
const callSchema = baseContactFormSchema.extend({
  type: z.literal("call"),
  product: z.string().optional(),
  cost: z.string().optional(),
});

// Combined schema using discriminated union
const contactFormSchema = z.discriminatedUnion("type", [orderSchema, callSchema]);

const SUNDRE_LOCATION = "Sundre, AB, Canada";

export function registerRoutes(app: Express): Server {
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const formData = contactFormSchema.parse(req.body);

      // Prepare email data based on request type
      const emailData = formData.type === "order"
        ? formatOrderEmail(formData)
        : formatCallEmail(formData);

      // Send email notification using SendGrid
      const emailSent = await sendEmail(emailData);

      if (!emailSent) {
        throw new Error("Failed to send email notification");
      }

      console.log(`${formData.type} request submitted:`, {
        name: formData.name,
        company: formData.company,
        type: formData.type
      });

      res.json({ message: "Form submitted successfully" });
    } catch (error) {
      console.error("Form submission error:", error);
      res.status(400).json({
        message: "Invalid form data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route for town name-based distance calculation
  app.get("/api/distance/:destination", async (req: Request, res: Response) => {
    try {
      let destination = decodeURIComponent(req.params.destination).trim();

      // Append province and country if not provided
      if (!destination.toLowerCase().includes("ab") && !destination.toLowerCase().includes("alberta")) {
        destination += ", AB";
      }
      if (!destination.toLowerCase().includes("canada")) {
        destination += ", Canada";
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error("Google Maps API key is not configured");
      }

      console.log('Calculating distance for town:', {
        origin: SUNDRE_LOCATION,
        destination: destination
      });

      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.searchParams.append('origins', SUNDRE_LOCATION);
      url.searchParams.append('destinations', destination);
      url.searchParams.append('mode', 'driving');
      url.searchParams.append('units', 'metric');
      url.searchParams.append('key', apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Distance API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Distance Matrix API response:", data);

      if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const kilometers = Math.round(distanceInMeters / 1000);

        console.log('Successfully calculated distance:', {
          destination,
          kilometers,
          distanceText: data.rows[0].elements[0].distance.text
        });

        res.json({ distance: kilometers });
      } else {
        console.error("Distance calculation failed:", {
          status: data.status,
          elementStatus: data.rows[0]?.elements[0]?.status,
          destination: destination,
          error: data.error_message
        });
        throw new Error(`Could not calculate distance to ${destination}`);
      }
    } catch (error) {
      console.error("Distance calculation error:", error);
      res.status(500).json({
        message: "Failed to calculate distance",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route for coordinate-based distance calculation
  app.get("/api/distance/coordinates/:lat/:lng", async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.params;
      const SUNDRE_COORDS = { lat: 51.7979, lng: -114.6402 }; // Sundre, AB coordinates

      // Parse and validate coordinates
      const latitude = Number(lat);
      const longitude = Number(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates provided');
      }

      // Validate coordinates are within Alberta bounds (including all meridian territories)
      if (latitude < 49.0 || latitude > 60.0 || longitude < -120.0 || longitude > -109.0) {
        throw new Error('Coordinates outside Alberta bounds');
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error("Google Maps API key is not configured");
      }

      console.log('Calculating distance from coordinates:', {
        origin: `${SUNDRE_COORDS.lat},${SUNDRE_COORDS.lng}`,
        destination: `${latitude},${longitude}`
      });

      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.searchParams.append('origins', `${SUNDRE_COORDS.lat},${SUNDRE_COORDS.lng}`);
      url.searchParams.append('destinations', `${latitude},${longitude}`);
      url.searchParams.append('mode', 'driving');
      url.searchParams.append('units', 'metric');
      url.searchParams.append('key', apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Distance API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Distance Matrix API response:", data);

      if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const kilometers = Math.round(distanceInMeters / 1000);
        res.json({ distance: kilometers });
      } else {
        console.error("Distance calculation failed:", {
          status: data.status,
          elementStatus: data.rows[0]?.elements[0]?.status,
          coordinates: `${latitude},${longitude}`,
          error: data.error_message
        });
        throw new Error(`Could not calculate distance to coordinates ${latitude},${longitude}`);
      }
    } catch (error) {
      console.error("Distance calculation error:", error);
      res.status(500).json({
        message: "Failed to calculate distance",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}