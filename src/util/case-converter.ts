/**
 * Converts a string from snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  // First collapse multiple underscores into a single underscore
  const normalized = str.replace(/_+/g, "_");
  // Remove leading and trailing underscores
  const withoutEdgeUnderscores = normalized.replace(/^_|_$/g, "");
  // Remove underscores before special characters and numbers without capitalization
  const handledSpecialChars = withoutEdgeUnderscores.replace(/_([^a-zA-Z])/g, "$1");
  // Convert the rest of the string
  const converted = handledSpecialChars.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  // Ensure first character is lowercase
  return converted.charAt(0).toLowerCase() + converted.slice(1);
}

/**
 * Converts a string from camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 */
export function camelizeKeys<T extends object>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => (v && typeof v === "object" ? camelizeKeys(v) : v));
  }

  return Object.keys(obj).reduce(
    (result, key) => {
      const value = obj[key as keyof T];
      const camelKey = toCamelCase(key);

      result[camelKey] = value && typeof value === "object" ? camelizeKeys(value as object) : value;

      return result;
    },
    {} as Record<string, any>,
  );
}

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 */
export function snakeizeKeys<T extends object>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => (v && typeof v === "object" ? snakeizeKeys(v) : v));
  }

  return Object.keys(obj).reduce(
    (result, key) => {
      const value = obj[key as keyof T];
      const snakeKey = toSnakeCase(key);

      result[snakeKey] = value && typeof value === "object" ? snakeizeKeys(value as object) : value;

      return result;
    },
    {} as Record<string, any>,
  );
}
