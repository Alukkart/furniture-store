export const CATEGORY_VALUES = [
  "Гостиная",
  "Спальня",
  "Столовая",
  "Домашний офис",
  "Хранение",
  "Освещение",
  "Ковры и текстиль",
] as const;

const CATEGORY_ALIASES: Record<string, string> = {
  "Living Room": "Гостиная",
  Bedroom: "Спальня",
  "Dining Room": "Столовая",
  "Home Office": "Домашний офис",
  Storage: "Хранение",
  Lighting: "Освещение",
  "Rugs & Textiles": "Ковры и текстиль",
  Гостиная: "Гостиная",
  Спальня: "Спальня",
  Столовая: "Столовая",
  "Домашний офис": "Домашний офис",
  Хранение: "Хранение",
  Освещение: "Освещение",
  "Ковры и текстиль": "Ковры и текстиль",
};

export function normalizeCategoryValue(value: string) {
  if (value === "All") {
    return value;
  }

  return CATEGORY_ALIASES[value] ?? value;
}
