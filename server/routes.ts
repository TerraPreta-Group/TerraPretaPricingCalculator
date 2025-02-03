import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  company: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  type: z.enum(["order", "call"]),
  product: z.string().optional(),
  cost: z.string().optional(),
});

export function registerRoutes(app: Express): Server {
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const formData = contactFormSchema.parse(req.body);

      // For now, just log the submission
      console.log("Form submission received:", formData);

      // TODO: Add email sending logic here when email service is configured

      res.json({ message: "Form submitted successfully" });
    } catch (error) {
      console.error("Form submission error:", error);
      res.status(400).json({ 
        message: "Invalid form data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}