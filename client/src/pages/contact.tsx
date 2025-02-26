import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { HelpIcon } from "@/components/ui/help-icon";
import { ArrowLeft } from "lucide-react";

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
  originalArea?: string;
  originalUnit?: string;
  acres?: string;
}

export default function Contact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const isOrder = params.get("type") === "order";

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
    originalArea: params.get("originalArea") || "",
    originalUnit: params.get("originalUnit") || "",
    acres: params.get("acres") || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOrder) {
      setFormData(prev => ({
        ...prev,
        acres: params.get("acres") || "",
        product: params.get("product") || "",
        cost: params.get("cost") || ""
      }));
    }
  }, [isOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#011028] to-black p-4">
      <Card className="w-full max-w-xl border-[1px] border-white/10 bg-white/95 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-[#011028] hover:text-[#011028]/70"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl font-bold text-[#011028]">
              {isOrder ? "Complete Your Order" : "Schedule a Call"}
            </CardTitle>
          </div>
          {isOrder && (
            <div className="text-sm text-muted-foreground">
              Ordering for {formData.acres} acres • ${params.get("cost")}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-medium text-[#011028]">Contact Information</Label>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="border-2 focus:border-[#003703]"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="border-2 focus:border-[#003703]"
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-2 focus:border-[#003703]"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">Company Name</Label>
                <Input
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  className="border-2 focus:border-[#003703]"
                  placeholder="Enter company name"
                />
              </div>
            </div>

            {isOrder && (
              <div className="space-y-4">
                <Label className="text-lg font-medium text-[#011028]">Delivery Address</Label>
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
                  <Input
                    id="street"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleInputChange}
                    className="border-2 focus:border-[#003703]"
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="city" className="text-sm font-medium">City</Label>
                    <Input
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="border-2 focus:border-[#003703]"
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="province" className="text-sm font-medium">Province</Label>
                    <Input
                      id="province"
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleInputChange}
                      className="border-2 focus:border-[#003703]"
                      placeholder="Province"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="border-2 focus:border-[#003703]"
                      placeholder="A1A 1A1"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isOrder && (
              <div className="space-y-4">
                <Label className="text-lg font-medium text-[#011028]">Additional Information</Label>
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">Reason for Call</Label>
                  <Select
                    name="reason"
                    value={formData.reason}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                    required
                  >
                    <SelectTrigger className="border-2 focus:border-[#003703]">
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Additional Notes (Optional)</Label>
              <textarea
                id="message"
                name="message"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border-2 focus:border-[#003703] bg-background resize-none"
                maxLength={250}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Any additional information you'd like us to know..."
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
                className="border-2 hover:bg-[#011028]/10 text-[#011028]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#003703] hover:bg-[#003703]/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">Submit</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}