import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useState } from "react";
import {
  convertToAcres,
  calculateRequiredProduct,
  calculateCost,
  formatNumber,
  type UnitType,
} from "@/lib/calculator";

const calculateToteBags = (requiredProduct: number): number => {
  return Math.ceil(requiredProduct / 1000);
};

export default function Home() {
  const [area, setArea] = useState<string>("");
  const [unit, setUnit] = useState<UnitType>("acre");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [customArea, setCustomArea] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<UnitType>("acre");

  const handleAreaChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setArea(value);
    }
  };

  const handleNumericInput = (value: string, setter: (value: string) => void) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setter(value);
      if (setter === setLength || setter === setWidth) {
        const newArea = value === "" || width === "" || length === ""
          ? ""
          : (parseFloat(value) * (setter === setLength ? parseFloat(width) : parseFloat(length))).toString();
        setCustomArea(newArea);
        setArea(newArea);
        setUnit(customUnit);
      }
    }
  };

  const acres = area ? convertToAcres(parseFloat(area), unit) : 0;
  const requiredProduct = calculateRequiredProduct(acres);
  const totalCost = calculateCost(requiredProduct);
  const toteBags = calculateToteBags(requiredProduct);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Pellet Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Area Input Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="area" className="block mb-2">Area</Label>
              <div className="flex gap-4 justify-center">
                <Input
                  id="area"
                  type="text"
                  value={area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  placeholder="Enter area..."
                  className="w-[120px]"
                />
                <Select value={unit} onValueChange={(value) => setUnit(value as UnitType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqft">Square Feet</SelectItem>
                    <SelectItem value="sqm">Square Meters</SelectItem>
                    <SelectItem value="acre">Acres</SelectItem>
                    <SelectItem value="ha">Hectares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Custom Area Calculator */}
          <div className="space-y-4">
            <div className="text-center">
              <Label className="block mb-2">Custom Area Calculator</Label>
              <div className="flex items-center gap-4 justify-center">
                <Input
                  type="text"
                  value={length}
                  onChange={(e) => handleNumericInput(e.target.value, setLength)}
                  placeholder="Length"
                  className="w-[100px]"
                />
                <span className="text-lg font-bold">×</span>
                <Input
                  type="text"
                  value={width}
                  onChange={(e) => handleNumericInput(e.target.value, setWidth)}
                  placeholder="Width"
                  className="w-[100px]"
                />
                <span className="text-lg font-bold">=</span>
                <Input
                  type="text"
                  value={customArea}
                  readOnly
                  placeholder="Area"
                  className="w-[100px] bg-muted"
                />
                <Select value={customUnit} onValueChange={(value) => {
                  setCustomUnit(value as UnitType);
                  setUnit(value as UnitType);
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqft">Square Feet</SelectItem>
                    <SelectItem value="sqm">Square Meters</SelectItem>
                    <SelectItem value="acre">Acres</SelectItem>
                    <SelectItem value="ha">Hectares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rates and Results Table */}
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Application Rate</TableCell>
                <TableCell>1,500 lbs/acre</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Product Cost</TableCell>
                <TableCell>$1.75/lb</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Required Product</TableCell>
                <TableCell>{formatNumber(requiredProduct)} lbs</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Tote Bags Required</TableCell>
                <TableCell>{toteBags} bags (1,000 lbs each)</TableCell>
              </TableRow>
              <TableRow className="bg-primary/10 py-2">
                <TableCell className="font-bold text-lg">Total Cost</TableCell>
                <TableCell className="text-2xl font-bold text-primary">${formatNumber(totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Link href={`/contact?type=order&product=${requiredProduct}&cost=${totalCost}`}>
              <Button className="bg-primary hover:bg-primary/90">
                Complete Order
              </Button>
            </Link>
            <Link href="/contact?type=call">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Schedule a Call
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            All calculations are automatically converted to acres
          </p>
        </CardContent>
      </Card>
    </div>
  );
}