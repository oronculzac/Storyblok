const PLACEHOLDER_REGEXES = [
  /{{\s*[\w.-]+\s*}}/g, // Handlebars style
  /%{\s*[\w.-]+\s*}/g, // Rails style
  /:\w+/g // colon notation
];

export const extractPlaceholders = (text: string): string[] => {
  const placeholders = new Set<string>();

  for (const regex of PLACEHOLDER_REGEXES) {
    const matches = text.match(regex);
    if (!matches) continue;
    matches.forEach((match) => placeholders.add(match.trim()));
  }

  return Array.from(placeholders);
};

export const findMissingPlaceholders = (expected: string[], translatedText: string): string[] => {
  const translatedPlaceholders = new Set(extractPlaceholders(translatedText));
  return expected.filter((placeholder) => !translatedPlaceholders.has(placeholder.trim()));
};

export const assertPlaceholdersPreserved = (expected: string[], translatedText: string): void => {
  const missing = findMissingPlaceholders(expected, translatedText);
  if (missing.length > 0) {
    throw new Error(`Missing placeholders: ${missing.join(", ")}`);
  }
};
