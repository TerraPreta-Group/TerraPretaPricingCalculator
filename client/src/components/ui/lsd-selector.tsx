import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LSDSelectorProps {
  value: {
    lsd: string;
    section: string;
    township: string;
    range: string;
    meridian: string;
  };
  onChange: (value: {
    lsd: string;
    section: string;
    township: string;
    range: string;
    meridian: string;
  }) => void;
}

export function LSDSelector({ value, onChange }: LSDSelectorProps) {
  // Generate arrays for the dropdown options
  const lsdOptions = Array.from({ length: 16 }, (_, i) => (i + 1).toString());
  const sectionOptions = Array.from({ length: 36 }, (_, i) => (i + 1).toString());
  const townshipOptions = Array.from({ length: 126 }, (_, i) => (i + 1).toString());
  const rangeOptions = Array.from({ length: 34 }, (_, i) => (i + 1).toString());
  const meridianOptions = ["W4", "W5", "W6"];

  const handleChange = (field: keyof typeof value, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <div className="space-y-2">
          <Label className="text-center block">LSD</Label>
          <Select value={value.lsd} onValueChange={(v) => handleChange("lsd", v)}>
            <SelectTrigger>
              <SelectValue placeholder="LSD" />
            </SelectTrigger>
            <SelectContent>
              {lsdOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-center block">Section</Label>
          <Select
            value={value.section}
            onValueChange={(v) => handleChange("section", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sectionOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-center block">Township</Label>
          <Select
            value={value.township}
            onValueChange={(v) => handleChange("township", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Township" />
            </SelectTrigger>
            <SelectContent>
              {townshipOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-center block">Range</Label>
          <Select
            value={value.range}
            onValueChange={(v) => handleChange("range", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-center block">Meridian</Label>
          <Select
            value={value.meridian}
            onValueChange={(v) => handleChange("meridian", v)}
          >
            <SelectTrigger className="min-w-[80px]">
              <SelectValue placeholder="Meridian" />
            </SelectTrigger>
            <SelectContent>
              {meridianOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center">
        Format: {value.lsd || "LSD"}-{value.section || "Section"}-{value.township || "Township"}-{value.range || "Range"} {value.meridian || "Meridian"}
      </div>
    </div>
  );
}