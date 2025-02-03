import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  convertToAcres,
  calculateRequiredProduct,
  calculateCost,
  formatNumber,
  type UnitType,
} from "@/lib/calculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export default function Home() {
  const [area, setArea] = useState<string>("");
  const [unit, setUnit] = useState<UnitType>("acre");

  const handleAreaChange = (value: string) => {
    // Only allow numbers and decimal points
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setArea(value);
    }
  };

  const acres = area ? convertToAcres(parseFloat(area), unit) : 0;
  const requiredProduct = calculateRequiredProduct(acres);
  const totalCost = calculateCost(requiredProduct);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Agricultural Product Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="area">Area</Label>
            <div className="flex gap-4">
              <Input
                id="area"
                type="text"
                value={area}
                onChange={(e) => handleAreaChange(e.target.value)}
                placeholder="Enter area..."
                className="flex-1"
              />
              <Select value={unit} onValueChange={(value) => setUnit(value as UnitType)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">sq ft</SelectItem>
                  <SelectItem value="sqm">m²</SelectItem>
                  <SelectItem value="acre">acres</SelectItem>
                  <SelectItem value="ha">ha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>All calculations are converted to acres automatically</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Required Product</Label>
                <p className="text-2xl font-semibold">
                  {formatNumber(requiredProduct)} lbs
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Total Cost</Label>
                <p className="text-2xl font-semibold">
                  ${formatNumber(totalCost)}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Application Rate: 1,500 lbs/acre</p>
              <p>Product Cost: $1.75/lb</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}