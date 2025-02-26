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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#011028] to-black p-4">
      <Card className="w-full max-w-xl border-[1px] border-white/10 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#011028]">
            Pellet Pricing Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Wellsites Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="wellsites" className="block mb-2 text-xl font-medium text-[#011028]">Number of Wellsites</Label>
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
                  className="w-[120px] text-[#011028]"
                />
                <span className="text-sm text-[#011028]">100m × 100m</span>
              </div>
            </div>
          </div>

          {/* Existing Area Input Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="area" className="block mb-2 text-xl font-medium text-[#011028]">Custom Area</Label>
              <div className="flex gap-4 justify-center">
                <Input
                  id="area"
                  type="text"
                  value={area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  placeholder="Enter area..."
                  className="w-[120px] text-[#011028]"
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
              <Label className="block mb-2 text-xl font-medium text-[#011028]">Custom Area</Label>
              <div className="flex items-center gap-4 justify-center">
                <Input
                  type="text"
                  value={length}
                  onChange={(e) => handleNumericInput(e.target.value, setLength)}
                  placeholder="Length"
                  className="w-[100px] text-[#011028]"
                />
                <span className="text-lg font-bold text-[#011028]">×</span>
                <Input
                  type="text"
                  value={width}
                  onChange={(e) => handleNumericInput(e.target.value, setWidth)}
                  placeholder="Width"
                  className="w-[100px] text-[#011028]"
                />
                <span className="text-lg font-bold text-[#011028]">=</span>
                <Input
                  type="text"
                  value={customArea}
                  readOnly
                  placeholder="Area"
                  className="w-[100px] bg-muted text-[#011028]"
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
                <TableCell className="font-medium text-base text-center text-[#011028]">Recommended Application Rate</TableCell>
                <TableCell className="text-base text-center pr-8 text-[#011028]">1500 lbs per Acre</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">Cost per lb</TableCell>
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
                <TableCell className="font-medium text-base text-center text-[#011028]">Pellets</TableCell>
                <TableCell className="text-base text-center pr-8 text-[#011028]">{Math.round(requiredProduct)} lbs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">
                  <div className="space-y-1">
                    <div>Tote Bags</div>
                    <div className="text-sm text-muted-foreground">1000 lbs/bag</div>
                  </div>
                </TableCell>
                <TableCell className="text-base text-center pr-8 text-[#011028]">{toteBags} bags</TableCell>
              </TableRow>
              <TableRow className="bg-gray-200 border-2 border-black">
                <TableCell className="font-bold text-xl text-center text-[#011028]">Pellets</TableCell>
                <TableCell className="text-xl font-bold text-primary text-center pr-8 text-[#011028]">${formatNumber(pelletsCost)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">Pickup from Sundre</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={pickup === "yes" ? "default" : "outline"}
                        className="w-[100px] text-[#011028]"
                        onClick={() => setPickup("yes")}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={pickup === "no" ? "default" : "outline"}
                        className="w-[100px] text-[#011028]"
                        onClick={() => setPickup("no")}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">Delivery from Sundre</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={locationType === "town" ? "default" : "outline"}
                        onClick={() => setLocationType("town")}
                        className="w-[100px] text-[#011028]"
                      >
                        Town
                      </Button>
                      <Button
                        variant={locationType === "lsd" ? "default" : "outline"}
                        onClick={() => setLocationType("lsd")}
                        className="w-[100px] text-[#011028]"
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
                          className="w-[200px] text-[#011028]"
                        />
                        <div className="flex items-center gap-2 text-sm text-[#011028]">
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
                        <div className="flex flex-col items-center gap-2 justify-center text-sm text-[#011028]">
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
                <TableCell className="font-bold text-xl text-center text-[#011028]">Delivery<br/><span className="text-sm font-normal text-[#011028]">(Round Trip)</span></TableCell>
                <TableCell className="text-xl font-bold text-primary text-center pr-8 text-[#011028]">${formatNumber(deliveryCost)}</TableCell>
              </TableRow>
              <TableRow className="bg-green-100 border-2 border-black border-t-4">
                <TableCell className="font-bold text-2xl text-center text-[#011028]">Total Cost</TableCell>
                <TableCell className="text-2xl font-bold text-primary text-center pr-8 text-[#011028]">${formatNumber(totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Link href={`/contact?type=order&product=${requiredProduct}&cost=${totalCost}&acres=${acres.toFixed(2)}`}>
              <Button variant="outline" className="border-2 border-[#003703] hover:bg-[#003703]/10 text-[#003703] text-lg py-6 px-8 shadow-lg">
                Next Step
              </Button>
            </Link>
            <Link href="/contact?type=call">
              <Button variant="outline" className="border-2 border-[#011028] hover:bg-[#011028]/10 text-[#011028] text-lg py-6 px-8 shadow-lg">
                Questions?
              </Button>
            </Link>
          </div>

          <p className="text-xs text-[#011028]/70 text-center">
            All calculations are automatically converted to acres. Note: 1 hectare is approximately 2.47 acres.
          </p>

        </CardContent>
      </Card>
    </div>
  );
}