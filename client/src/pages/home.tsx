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
import { useState, useEffect } from "react";
import {
  convertToAcres,
  calculateRequiredProduct,
  calculateCost,
  formatNumber,
  type UnitType,
} from "@/lib/calculator";
import { calculateDistance } from "@/lib/distance";

const calculateToteBags = (requiredProduct: number): number => {
  return Math.ceil(requiredProduct / 1000);
};

const calculateDeliveryCost = (distance: number): number => {
  return distance * 1.5; // $1.50 per km
};

export default function Home() {
  const [area, setArea] = useState<string>("");
  const [unit, setUnit] = useState<UnitType>("acre");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [customArea, setCustomArea] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<UnitType>("acre");
  const [pickup, setPickup] = useState<string>("no");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("");
  const [deliveryDistance, setDeliveryDistance] = useState<string>("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

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

  // Debounce the distance calculation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (deliveryLocation.trim()) {
        setIsCalculatingDistance(true);
        try {
          const distance = await calculateDistance(deliveryLocation.trim());
          setDeliveryDistance(distance.toString());
        } catch (error) {
          console.error("Failed to calculate distance:", error);
        }
        setIsCalculatingDistance(false);
      } else {
        setDeliveryDistance("");
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [deliveryLocation]);

  const acres = area ? convertToAcres(parseFloat(area), unit) : 0;
  const requiredProduct = calculateRequiredProduct(acres);
  const pelletsCost = calculateCost(requiredProduct);
  const toteBags = calculateToteBags(requiredProduct);
  const deliveryCost = deliveryDistance ? calculateDeliveryCost(parseFloat(deliveryDistance)) : 0;
  const totalCost = pelletsCost + deliveryCost;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-xl border-2 border-black">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Pellet Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Area Input Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="area" className="block mb-2 text-xl font-medium">Area</Label>
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
              <Label className="block mb-2 text-xl font-medium">Custom Area Calculator</Label>
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
                <TableCell className="font-medium text-center text-base">Recommended Application Rate</TableCell>
                <TableCell className="text-base">1500 lbs per Acre</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Cost per lb</TableCell>
                <TableCell className="text-base">$1.75</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Required Pellets</TableCell>
                <TableCell className="text-base">{formatNumber(requiredProduct)} lbs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Tote Bags Required</TableCell>
                <TableCell className="text-base">{toteBags} bags (1,000 lbs each)</TableCell>
              </TableRow>
              <TableRow className="bg-gray-200 border-2 border-black">
                <TableCell className="font-bold text-xl text-center">Cost of Pellets</TableCell>
                <TableCell className="text-xl font-bold text-primary">${formatNumber(pelletsCost)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Pickup from Sundre</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant={pickup === "yes" ? "default" : "outline"}
                      size="lg"
                      onClick={() => setPickup("yes")}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={pickup === "no" ? "default" : "outline"}
                      size="lg"
                      onClick={() => setPickup("no")}
                    >
                      No
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Delivery from Sundre</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      placeholder="Enter town or location..."
                      className="w-full"
                    />
                    <div className="flex items-center gap-2 justify-end text-sm">
                      {deliveryLocation ? (
                        isCalculatingDistance ? (
                          <span className="text-muted-foreground">Calculating distance...</span>
                        ) : deliveryDistance ? (
                          <>
                            <span>{Math.round(parseFloat(deliveryDistance))} km</span>
                            <span>× $1.50 per km</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Enter a valid location</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Enter a location to calculate distance</span>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-200 border-2 border-black">
                <TableCell className="font-bold text-xl text-center">Cost of Delivery</TableCell>
                <TableCell className="text-xl font-bold text-primary">${formatNumber(deliveryCost)}</TableCell>
              </TableRow>
              <TableRow className="bg-green-100 border-2 border-black border-t-4">
                <TableCell className="font-bold text-2xl text-center">Total Cost</TableCell>
                <TableCell className="text-2xl font-bold text-primary">${formatNumber(totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Link href={`/contact?type=order&product=${requiredProduct}&cost=${totalCost}&acres=${acres.toFixed(2)}`}>
              <Button className="bg-primary hover:bg-primary/90 text-lg py-6 px-8">
                Complete Order
              </Button>
            </Link>
            <Link href="/contact?type=call">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white text-lg py-6 px-8">
                Questions?
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            All calculations are automatically converted to acres. Note: 1 hectare is approximately 2.47 acres.
          </p>

        </CardContent>
      </Card>
    </div>
  );
}