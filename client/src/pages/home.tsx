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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpIcon } from "@/components/ui/help-icon";

const CONVERSION_RATES = {
  sqm_to_acre: 0.000247105,
};

const determinePricePerLb = (productAmount: number): number => {
  return productAmount >= 50000 ? 1.50 : 1.75;
};

// Add validation helpers and visual feedback for area input
const isAreaValid = (area: string): boolean => {
  return area !== "" && parseFloat(area) > 0;
};

export default function Home() {
  const [areaInputMethod, setAreaInputMethod] = useState<
    "wellsites" | "area" | "dimensions"
  >("wellsites");
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
    meridian: "W4",
  });
  const [wellsites, setWellsites] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Added state for loading
  const [areaError, setAreaError] = useState<string>("");

  const validateArea = (): boolean => {
    if (!area || parseFloat(area) <= 0) {
      setAreaError("Please enter a valid area");
      return false;
    }
    setAreaError("");
    return true;
  };

  const handleAreaChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setArea(value);
      // Clear other input methods when using direct area input
      if (value) {
        setLength("");
        setWidth("");
        setWellsites("");
      }
    }
  };

  const handleNumericInput = (
    value: string,
    setter: (value: string) => void,
  ) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setter(value);
      if (setter === setLength || setter === setWidth) {
        const newArea =
          value === "" || width === "" || length === ""
            ? ""
            : (
                parseFloat(value) *
                (setter === setLength ? parseFloat(width) : parseFloat(length))
              ).toString();
        setCustomArea(newArea);
        setArea(newArea);
        setUnit(customUnit);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        (locationType === "town" && deliveryLocation.trim()) ||
        (locationType === "lsd" &&
          lsdCoords.lsd &&
          lsdCoords.section &&
          lsdCoords.township &&
          lsdCoords.range)
      ) {
        setIsCalculatingDistance(true);
        try {
          const distance = await calculateDistance(
            locationType === "town" ? deliveryLocation.trim() : lsdCoords,
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
      const wellsiteArea = (
        parseInt(wellsites) *
        10000 *
        CONVERSION_RATES.sqm_to_acre
      ).toFixed(2);
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
  const pricePerLb = determinePricePerLb(requiredProduct);
  const pelletsCost = calculateCost(requiredProduct, pricePerLb);
  const toteBags = calculateToteBags(requiredProduct);
  const deliveryCost = deliveryDistance
    ? calculateDeliveryCost(parseFloat(deliveryDistance))
    : 0;
  const totalCost = pelletsCost + (pickup === "no" ? deliveryCost : 0);

  const handleNextStep = async () => {
    if (!validateArea()) {
      // Scroll to area input and show error
      const areaInput = document.getElementById("area-section");
      areaInput?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#011028] to-black p-4">
      <Card className="w-full max-w-xl border-[1px] border-white/10 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#011028]">
            Pellet Pricing Estimator
            <HelpIcon 
              content={
                <div className="space-y-2">
                  <p>Get an instant quote for your agricultural pellet needs.</p>
                  <p>This calculator helps you:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Calculate required product based on area</li>
                    <li>Estimate delivery costs</li>
                    <li>Get total pricing including shipping</li>
                  </ul>
                </div>
              }
              side="right"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div id="area-section" className="space-y-4">
            <div className="text-center">
              <Label
                htmlFor="areaMethod"
                className={`block mb-2 text-xl font-medium ${areaError ? 'text-red-600' : 'text-[#011028]'}`}
              >
                Calculate Area By
                <HelpIcon 
                  content={
                    <div className="space-y-2">
                      <p>Choose how you want to calculate your area:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Number of Wellsites:</strong> For standard 100m × 100m wellsites</li>
                        <li><strong>Custom Area:</strong> Enter area in your preferred unit</li>
                        <li><strong>Length × Width:</strong> Calculate area from dimensions</li>
                      </ul>
                    </div>
                  }
                  side="right"
                />
              </Label>
              {areaError && (
                <div className="text-sm text-red-600 mt-1">{areaError}</div>
              )}
              <Select
                value={areaInputMethod}
                onValueChange={(value) => {
                  setAreaInputMethod(
                    value as "wellsites" | "area" | "dimensions",
                  );
                  // Clear all inputs when changing method
                  setArea("");
                  setLength("");
                  setWidth("");
                  setWellsites("");
                }}
              >
                <SelectTrigger className="w-[200px] mx-auto">
                  <SelectValue placeholder="Select calculation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wellsites">Number of Wellsites</SelectItem>
                  <SelectItem value="area">Custom Area</SelectItem>
                  <SelectItem value="dimensions">Length × Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {areaInputMethod === "wellsites" && (
            <div className="space-y-4">
              <div className="text-center">
                <Label
                  htmlFor="wellsites"
                  className="block mb-2 text-lg font-medium text-[#011028]"
                >
                  Number of Wellsites
                  <HelpIcon content="Each wellsite is calculated as a 100m × 100m area (1 hectare). This standardized size is used across the industry for consistent area calculations." />
                </Label>
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
                          const totalSqMeters = parseInt(value) * 10000;
                          const acres = (
                            totalSqMeters * CONVERSION_RATES.sqm_to_acre
                          ).toFixed(2);
                          setArea(acres);
                          setUnit("acre");
                        } else {
                          setArea("");
                        }
                      }
                    }}
                    placeholder="Enter number"
                    className="w-[120px] text-[#011028]"
                  />
                  <span className="text-sm text-[#011028]">
                    100m × 100m per site
                  </span>
                </div>
              </div>
            </div>
          )}

          {areaInputMethod === "area" && (
            <div className="space-y-4">
              <div className="text-center">
                <Label
                  htmlFor="area"
                  className="block mb-2 text-lg font-medium text-[#011028]"
                >
                  Custom Area
                </Label>
                <div className="flex gap-4 justify-center">
                  <Input
                    id="area"
                    type="text"
                    value={area}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    placeholder="Enter area"
                    className="w-[120px] text-[#011028]"
                  />
                  <Select
                    value={unit}
                    onValueChange={(value) => setUnit(value as UnitType)}
                  >
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
          )}

          {areaInputMethod === "dimensions" && (
            <div className="space-y-4">
              <div className="text-center">
                <Label className="block mb-2 text-lg font-medium text-[#011028]">
                  Area by Dimensions
                </Label>
                <div className="flex items-center gap-4 justify-center">
                  <Input
                    type="text"
                    value={length}
                    onChange={(e) =>
                      handleNumericInput(e.target.value, setLength)
                    }
                    placeholder="Length"
                    className="w-[100px] text-[#011028]"
                  />
                  <span className="text-lg font-bold text-[#011028]">×</span>
                  <Input
                    type="text"
                    value={width}
                    onChange={(e) =>
                      handleNumericInput(e.target.value, setWidth)
                    }
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
                  <Select
                    value={customUnit}
                    onValueChange={(value) => {
                      setCustomUnit(value as UnitType);
                      setUnit(value as UnitType);
                    }}
                  >
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
          )}

          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">
                  Recommended Application Rate
                  <HelpIcon content="Standard application rate for optimal soil stabilization and erosion control. This rate ensures proper coverage and effectiveness." />
                </TableCell>
                <TableCell className="text-base text-center pr-8 text-[#011028]">1500 lbs per Acre</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">
                  Cost per lb
                  <HelpIcon 
                    content={
                      <div className="space-y-2">
                        <p>Our tiered pricing structure:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Standard Rate ($1.75/lb):</strong> Orders under 50,000 lbs</li>
                          <li><strong>Bulk Rate ($1.50/lb):</strong> Orders of 50,000 lbs or more</li>
                        </ul>
                        <p className="text-xs mt-2">Your price is automatically calculated based on your order size.</p>
                      </div>
                    }
                    side="bottom"
                  />
                </TableCell>
                <TableCell className="text-base text-center pr-8">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">${pricePerLb.toFixed(2)}/lb</span>
                    <span className="text-sm text-muted-foreground">
                      {requiredProduct >= 50000 ? "Bulk Rate Applied" : "Standard Rate"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">Pellets</TableCell>
                <TableCell className="text-base text-center pr-8 text-[#011028]">{Math.round(requiredProduct)} lbs</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base text-center text-[#011028]">
                  <div className="space-y-1">
                    <div>
                      Tote Bags
                      <HelpIcon content="Each tote bag has a capacity of 1000 lbs. We calculate the number of bags needed by rounding up to ensure you have enough product." />
                    </div>
                    <div className="text-sm text-muted-foreground">1000 lbs/bag</div>
                  </div>
                </TableCell>
                <TableCell className="text-base text-center pr-8 text-[#011028]">{toteBags} bags</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="space-y-4 w-full">
            <div className="text-center">
              <Label className="text-lg font-medium text-[#011028] inline-flex items-center justify-center">
                Shipping Method
                <HelpIcon content="Choose between pickup from our Sundre location or delivery via TerraPreta Express hotshot service." />
              </Label>
            </div>

            <div className="space-y-2">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors w-full ${
                  pickup === "yes" 
                    ? "border-[#003703] bg-[#003703]/5" 
                    : "border-gray-200 hover:border-[#003703]/50"
                }`}
                onClick={() => setPickup("yes")}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    pickup === "yes" 
                      ? "border-[#003703] bg-[#003703]" 
                      : "border-gray-300"
                  }`} />
                  <div>
                    <div className="font-medium">Pickup from Sundre</div>
                    <div className="text-sm text-muted-foreground">Free</div>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors w-full ${
                  pickup === "no" 
                    ? "border-[#003703] bg-[#003703]/5" 
                    : "border-gray-200 hover:border-[#003703]/50"
                }`}
                onClick={() => setPickup("no")}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    pickup === "no" 
                      ? "border-[#003703] bg-[#003703]" 
                      : "border-gray-300"
                  }`} />
                  <div>
                    <div className="font-medium">TerraPreta Express Hotshot</div>
                    <div className="text-sm text-muted-foreground">$150/hour including travel time</div>
                  </div>
                </div>

                {pickup === "no" && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Delivery Location</div>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={locationType === "town" ? "outline" : "outline"}
                        onClick={() => setLocationType("town")}
                        className={`w-[100px] text-[#011028] ${locationType === "town" ? "border-2 border-[#003703]" : ""}`}
                      >
                        Town
                      </Button>
                      <Button
                        variant={locationType === "lsd" ? "outline" : "outline"}
                        onClick={() => setLocationType("lsd")}
                        className={`w-[100px] text-[#011028] ${locationType === "lsd" ? "border-2 border-[#003703]" : ""}`}
                      >
                        LSD
                      </Button>
                    </div>

                    {locationType === "town" ? (
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Input
                          type="text"
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          placeholder="Enter town name"
                          className="w-[200px] text-[#011028]"
                        />
                        <HelpIcon 
                          content={
                            <div className="space-y-2">
                              <p>Enter a town or city name in Alberta.</p>
                              <p>Format: <em>Town Name, AB</em></p>
                              <p>Example: "Red Deer, AB" or "Edmonton, AB"</p>
                            </div>
                          }
                          side="right"
                        />
                        <div className="flex items-center gap-2 text-sm text-[#011028]">
                          {deliveryLocation ? (
                            isCalculatingDistance ? (
                              <span className="text-muted-foreground">
                                Calculating distance...
                              </span>
                            ) : deliveryDistance ? (
                              <span>
                                {Math.round(parseFloat(deliveryDistance) * 2)} km •{" "}
                                {calculateDeliveryHours(parseFloat(deliveryDistance))} hrs • $150/hr
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Please include the town name and province (e.g., Hanna, AB)
                              </span>
                            )
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-sm font-medium text-[#011028]">Legal Subdivision (LSD) Location</span>
                          <HelpIcon 
                            content={
                              <div className="space-y-2">
                                <p>Enter your location using the Alberta Township System (ATS):</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  <li><strong>LSD:</strong> Legal Subdivision (1-16)</li>
                                  <li><strong>Section:</strong> Section number (1-36)</li>
                                  <li><strong>Township:</strong> Township number</li>
                                  <li><strong>Range:</strong> Range number</li>
                                  <li><strong>Meridian:</strong> W4, W5, or W6</li>
                                </ul>
                              </div>
                            }
                            side="top"
                          />
                        </div>
                        <LSDSelector value={lsdCoords} onChange={setLsdCoords} />
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
                                        Calculated coordinates: {coords.lat.toFixed(6)},{" "}
                                        {coords.lng.toFixed(6)}
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
                                <span>
                                  {Math.round(parseFloat(deliveryDistance) * 2)} km round trip •{" "}
                                  {calculateDeliveryHours(parseFloat(deliveryDistance))} hrs total • $150/hr
                                </span>
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
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-4 border-2 rounded-lg bg-gray-200/50 w-full border-gray-200 hover:border-[#003703]/50">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xl text-[#011028]">Pellets</div>
                <div className="text-xl font-bold text-[#011028]">${formatNumber(pelletsCost)}</div>
              </div>
            </div>

            {pickup === "no" && deliveryDistance && (
              <div className="p-4 border-2 rounded-lg bg-gray-200/50 w-full border-gray-200 hover:border-[#003703]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xl text-[#011028]">Delivery</div>
                    <div className="text-sm font-normal text-[#011028]/70">Round trip · $150/hour including travel time</div>
                  </div>
                  <div className="text-xl font-bold text-[#011028]">${formatNumber(deliveryCost)}</div>
                </div>
              </div>
            )}

            <div className="p-4 border-2 rounded-lg bg-green-100 w-full border-[#003703] border-t-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-2xl text-[#011028]">Total Cost</div>
                <div className="text-2xl font-bold text-[#011028]">${formatNumber(totalCost)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href={`/contact?type=order&product=${requiredProduct}&cost=${totalCost}&acres=${acres.toFixed(2)}`}
              onClick={(e) => {
                if (!validateArea()) {
                  e.preventDefault();
                  return;
                }
                handleNextStep();
              }}
            >
              <Button
                variant="outline"
                className={`w-full sm:w-auto border-2 border-[#011028] hover:bg-[#011028]/10 text-[#011028] text-lg py-4 sm:py-6 px-6 sm:px-8 shadow-lg relative ${
                  !isAreaValid(area) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitting || !isAreaValid(area)}
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">Next Step</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-[#011028] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Next Step"
                )}
              </Button>
            </Link>
            <Link href="/contact?type=call">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-2 border-[#011028] hover:bg-[#011028]/10 text-[#011028] text-lg py-4 sm:py-6 px-6 sm:px-8 shadow-lg"
              >
                Questions?
              </Button>
            </Link>
          </div>

          <p className="text-xs text-[#011028]/70 text-center mt-4 px-4">
            All calculations are automatically converted to acres. Note: 1
            hectare is approximately 2.47 acres.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}