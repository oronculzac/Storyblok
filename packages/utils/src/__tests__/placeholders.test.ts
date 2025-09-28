import { describe, expect, it } from "vitest";
import {
  assertPlaceholdersPreserved,
  extractPlaceholders,
  findMissingPlaceholders,
  setValueAtPath
} from "../index.ts";

describe("placeholder utilities", () => {
  it("extracts placeholders from different syntaxes", () => {
    const placeholders = extractPlaceholders("Hello {{name}} your code is %{status} :emoji");
    expect(placeholders.sort()).toEqual([":emoji", "{{name}}", "%{status}"].sort());
  });

  it("finds missing placeholders", () => {
    const missing = findMissingPlaceholders(["{{cta}}"], "Buy now");
    expect(missing).toEqual(["{{cta}}"]);
  });

  it("throws when placeholders are missing", () => {
    expect(() => assertPlaceholdersPreserved(["{{cta}}"], "Buy now")).toThrow(/Missing placeholders/);
  });

  it("does not throw when placeholders are preserved", () => {
    expect(() => assertPlaceholdersPreserved(["{{cta}}"], "Buy {{cta}} now")).not.toThrow();
  });

  it("sets deep values with dot notation", () => {
    const payload: Record<string, unknown> = {};
    setValueAtPath(payload, "body.hero.title", "Bonjour");
    expect(payload).toEqual({ body: { hero: { title: "Bonjour" } } });
  });
});
