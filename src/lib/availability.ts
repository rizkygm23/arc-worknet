import type { Availability } from "./types";

export function availabilityLabel(value?: Availability | null): string {
  switch (value) {
    case "open":
      return "Open to work";
    case "limited":
      return "Limited availability";
    case "unavailable":
      return "Not available";
    default:
      return "Not set";
  }
}

export const availabilityOptions: Array<{ value: Availability; label: string }> = [
  { value: "open", label: "Open to work" },
  { value: "limited", label: "Limited availability" },
  { value: "unavailable", label: "Not available" },
];
