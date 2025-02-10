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

  app.get("/api/distance/:destination", async (req: Request, res: Response) => {
    try {
      const destination = decodeURIComponent(req.params.destination);
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        throw new Error("Google Maps API key is not configured");
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
          SUNDRE_LOCATION
        )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Distance API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Distance API response:", data);

      if (
        data.status === "OK" &&
        data.rows[0]?.elements[0]?.status === "OK"
      ) {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const kilometers = distanceInMeters / 1000;
        res.json({ distance: kilometers });
      } else {
        throw new Error("Could not calculate distance");
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