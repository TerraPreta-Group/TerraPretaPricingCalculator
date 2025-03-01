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
  calculateToteBags,
  calculateDeliveryHours,
  calculateDeliveryCost,
  formatNumber,
  type UnitType,
} from "@/lib/calculator";
import { calculateDistance } from "@/lib/distance";
import { LSDSelector } from "@/components/ui/lsd-selector";
import { formatLSDLocation } from "@/lib/lsd";
import { lsdToLatLong } from "@/lib/lsd";

const CONVERSION_RATES = {
  sqm_to_acre: 0.000247105
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
  const [locationType, setLocationType] = useState<"town" | "lsd">("town");
  const [lsdCoords, setLsdCoords] = useState({
    lsd: "",
    section: "",
    township: "",
    range: "",
    meridian: "W4"
  });
  const [pricePerLb, setPricePerLb] = useState<number>(1.75);
  const [wellsites, setWellsites] = useState<string>("");

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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if ((locationType === "town" && deliveryLocation.trim()) ||
          (locationType === "lsd" && lsdCoords.lsd &&
           lsdCoords.section && lsdCoords.township &&
           lsdCoords.range)) {

        setIsCalculatingDistance(true);
        try {
          const distance = await calculateDistance(
            locationType === "town"
              ? deliveryLocation.trim()
              : lsdCoords
          );
          setDeliveryDistance(distance.toString());
        } catch (error) {
          console.error("Failed to calculate distance:", error);
          setDeliveryDistance("");
        } finally {
          setIsCalculatingDistance(false);
        }
      } else {
        setDeliveryDistance("");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [deliveryLocation, locationType, lsdCoords]);

  useEffect(() => {
    if (area && wellsites) {
      // Clear wellsites if area is manually changed
      const wellsiteArea = (parseInt(wellsites) * 10000 * CONVERSION_RATES.sqm_to_acre).toFixed(2);
      if (area !== wellsiteArea) {
        setWellsites("");
      }
    }
  }, [area]);

  useEffect(() => {
    if (area && unit === "acre" && !wellsites) {
      // Calculate number of wellsites from acres
      const sqMeters = parseFloat(area) / CONVERSION_RATES.sqm_to_acre;
      const sites = Math.round(sqMeters / 10000); // 10000 sq meters per site
      if (sites > 0) {
        setWellsites(sites.toString());
      }
    }
  }, [area, unit]);

  const acres = area ? convertToAcres(parseFloat(area), unit) : 0;
  const requiredProduct = calculateRequiredProduct(acres);
  const pelletsCost = calculateCost(requiredProduct, pricePerLb);
  const toteBags = calculateToteBags(requiredProduct);
  const deliveryCost = deliveryDistance ? calculateDeliveryCost(parseFloat(deliveryDistance)) : 0;
  const totalCost = pelletsCost + (pickup === "no" ? deliveryCost : 0);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-xl border-2 border-black">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Pellet Pricing Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Wellsites Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="wellsites" className="block mb-2 text-xl font-medium">Number of Wellsites</Label>
              <div className="flex gap-4 justify-center items-center">
                <Input
                  id="wellsites"
                  type="text"
                  value={wellsites}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*$/.test(value)) {
                      setWellsites(value);
                      if (value) {
                        // Each wellsite is 100m x 100m = 10000 sqm
                        const totalSqMeters = parseInt(value) * 10000;
                        const acres = (totalSqMeters * CONVERSION_RATES.sqm_to_acre).toFixed(2);
                        setArea(acres);
                        setUnit("acre");
                      }
                    }
                  }}
                  placeholder="Enter number"
                  className="w-[120px]"
                />
                <span className="text-sm">100m × 100m</span>
              </div>
            </div>
          </div>

          {/* Existing Area Input Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="area" className="block mb-2 text-xl font-medium">Custom Area</Label>
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

          {/* Custom Area Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label className="block mb-2 text-xl font-medium">Custom Area</Label>
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
                <TableCell className="font-medium text-base text-center">Recommended Application Rate</TableCell>
                <TableCell className="text-base text-center pr-8">1500 lbs per Acre</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Cost per lb</TableCell>
                <TableCell className="text-base text-center pr-8">
                  <Select value={pricePerLb.toString()} onValueChange={(value) => setPricePerLb(parseFloat(value))}>
                    <SelectTrigger className="w-[100px] mx-auto">
                      <SelectValue>
                        ${pricePerLb.toFixed(2)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.50">$1.50</SelectItem>
                      <SelectItem value="1.75">$1.75</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Pellets</TableCell>
                <TableCell className="text-base text-center pr-8">{Math.round(requiredProduct)} lbs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">
                  <div className="space-y-1">
                    <div>Tote Bags</div>
                    <div className="text-sm text-muted-foreground">1000 lbs/bag</div>
                  </div>
                </TableCell>
                <TableCell className="text-base text-center pr-8">{toteBags} bags</TableCell>
              </TableRow>
              <TableRow className="bg-gray-200 border-2 border-black">
                <TableCell className="font-bold text-xl text-center">Pellets</TableCell>
                <TableCell className="text-xl font-bold text-primary text-center pr-8">${formatNumber(pelletsCost)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Pickup from Sundre</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={pickup === "yes" ? "default" : "outline"}
                        className="w-[100px]"
                        onClick={() => setPickup("yes")}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={pickup === "no" ? "default" : "outline"}
                        className="w-[100px]"
                        onClick={() => setPickup("no")}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center">Delivery from Sundre</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={locationType === "town" ? "default" : "outline"}
                        onClick={() => setLocationType("town")}
                        className="w-[100px]"
                      >
                        Town
                      </Button>
                      <Button
                        variant={locationType === "lsd" ? "default" : "outline"}
                        onClick={() => setLocationType("lsd")}
                        className="w-[100px]"
                      >
                        LSD
                      </Button>
                    </div>

                    {locationType === "town" ? (
                      <div className="flex items-center justify-center gap-4">
                        <Input
                          type="text"
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          placeholder="Enter town name"
                          className="w-[200px]"
                        />
                        <div className="flex items-center gap-2 text-sm">
                          {deliveryLocation ? (
                            isCalculatingDistance ? (
                              <span className="text-muted-foreground">Calculating distance...</span>
                            ) : deliveryDistance ? (
                              <span>{Math.round(parseFloat(deliveryDistance) * 2)} km • {calculateDeliveryHours(parseFloat(deliveryDistance))} hrs • $150/hr</span>
                            ) : (
                              <span className="text-muted-foreground">Please include the town name and province (e.g., Hanna, AB)</span>
                            )
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <LSDSelector
                          value={lsdCoords}
                          onChange={setLsdCoords}
                        />
                        <div className="flex flex-col items-center gap-2 justify-center text-sm">
                          {isCalculatingDistance ? (
                            <span className="text-muted-foreground">Calculating distance...</span>
                          ) : (
                            <>
                              {lsdCoords.lsd && lsdCoords.section && lsdCoords.township && lsdCoords.range && (
                                <div className="text-muted-foreground">
                                  {(() => {
                                    const coords = lsdToLatLong(lsdCoords);
                                    return coords ? (
                                      <span>
                                        Calculated coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                      </span>
                                    ) : (
                                      <span className="text-red-500">
                                        Invalid coordinates - please check LSD values
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                              {deliveryDistance ? (
                                <span>{Math.round(parseFloat(deliveryDistance) * 2)} km round trip • {calculateDeliveryHours(parseFloat(deliveryDistance))} hrs total • $150/hr</span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Select all LSD values to calculate distance
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-200 border-2 border-black">
                <TableCell className="font-bold text-xl text-center">Delivery<br/><span className="text-sm font-normal">(Round Trip)</span></TableCell>
                <TableCell className="text-xl font-bold text-primary text-center pr-8">${formatNumber(deliveryCost)}</TableCell>
              </TableRow>
              <TableRow className="bg-green-100 border-2 border-black border-t-4">
                <TableCell className="font-bold text-2xl text-center">Total Cost</TableCell>
                <TableCell className="text-2xl font-bold text-primary text-center pr-8">${formatNumber(totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Link href={`/contact?type=order&product=${requiredProduct}&cost=${totalCost}&acres=${acres.toFixed(2)}`}>
              <Button className="bg-primary hover:bg-primary/90 text-lg py-6 px-8">
                Next Step
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