/**
 * Converts a string into a URL-friendly slug.
 * @param text The string to slugify
 * @returns A formatted slug string
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

/**
 * Validates if a string is a valid HEX color.
 * @param color The color string to validate
 * @returns boolean
 */
export const validateHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Generate a unique product SKU in format PRD-YYYYMMDD-XXXX
 * where XXXX is a 4-character uppercase alphanumeric random string.
 */
export const generateSKU = (): string => {
  const date = new Date();
  const datePart = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRD-${datePart}-${randomPart}`;
};

/**
 * Generate a variant SKU from the base product SKU and the variant combination.
 * @param baseSku  The parent product SKU
 * @param combination  e.g. { Weight: "1kg", Flavor: "Chocolate" }
 * @returns e.g. "PRD-20240101-ABCD-1KG-CHO"
 */
export const generateVariantSKU = (
  baseSku: string,
  combination: Record<string, string>
): string => {
  const suffix = Object.values(combination)
    .map((v) =>
      v
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase()
    )
    .join("-");
  return `${baseSku}-${suffix}`;
};

/**
 * Generate all Cartesian product combinations from attribute axes.
 * @param axes  Array of { name: string; values: string[] }
 * @returns  Array of combination objects e.g. [{ Weight: "1kg", Flavor: "Chocolate" }, ...]
 */
export const generateVariantCombinations = (
  axes: Array<{ name: string; values: string[] }>
): Record<string, string>[] => {
  if (axes.length === 0) return [];

  const [first, ...rest] = axes;
  const restCombinations = generateVariantCombinations(rest);

  if (restCombinations.length === 0) {
    return first.values.map((v) => ({ [first.name]: v }));
  }

  return first.values.flatMap((v) =>
    restCombinations.map((combo) => ({ [first.name]: v, ...combo }))
  );
};

/**
 * Generate a short random ID (8 characters) for embedded sub-document IDs.
 */
export const generateId = (): string =>
  Math.random().toString(36).substring(2, 10);
