import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  reason?: string;
  message?: string;
}

export default function Contact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    phone: "",
    email: "",
    company: "",
    street: "",
    city: "",
    province: "",
    postalCode: "",
    reason: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get query parameters
  const params = new URLSearchParams(window.location.search);
  const isOrder = params.get("type") === "order";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only include product and cost for order requests
      const submitData = {
        ...formData,
        type: isOrder ? "order" : "call",
        ...(isOrder ? {
          product: params.get("product"),
          cost: params.get("cost")
        } : {})
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast({
        title: "Success!",
        description: isOrder
          ? "Your order has been submitted. We'll contact you soon!"
          : "Your call request has been received. We'll be in touch shortly!",
      });

      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isOrder ? "Complete Your Order" : "Schedule a Call"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-center block w-full">Full Name</Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-center block w-full">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-center block w-full">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-center block w-full">Company Name</Label>
              <Input
                id="company"
                name="company"
                required
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street" className="text-center block w-full">Street Address</Label>
              <Input
                id="street"
                name="street"
                required
                value={formData.street}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-center block w-full">City</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province" className="text-center block w-full">Province</Label>
                <Input
                  id="province"
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-center block w-full">Postal Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            {!isOrder && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Call</Label>
                <Select
                  name="reason"
                  value={formData.reason}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pricing">Did Justin Trudeau set your prices?</SelectItem>
                    <SelectItem value="impress">I need more info to impress my boss</SelectItem>
                    <SelectItem value="commitment">I like it, I just have commitment issues</SelectItem>
                    <SelectItem value="human">I just want to talk to a human</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">Message (250 characters max)</Label>
              <textarea
                id="message"
                name="message"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                maxLength={250}
                value={formData.message}
                onChange={handleInputChange}
              />
              <div className="text-sm text-muted-foreground text-right">
                {(formData.message?.length || 0)}/250 characters
              </div>
            </div>
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}