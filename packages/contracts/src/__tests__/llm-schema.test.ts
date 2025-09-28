import { describe, expect, it } from "vitest";
import { llmTranslationResponseSchema } from "../index.ts";

describe("llmTranslationResponseSchema", () => {
  it("validates a minimal valid payload", () => {
    const result = llmTranslationResponseSchema.safeParse({
      translationSegments: [
        {
          segmentId: "headline",
          translatedText: "Bonjour",
          placeholders: []
        }
      ],
      qaIssues: []
    });

    expect(result.success).toBe(true);
  });

  it("rejects payloads that omit required placeholders", () => {
    const result = llmTranslationResponseSchema.safeParse({
      translationSegments: [
        {
          segmentId: "headline",
          translatedText: "Bonjour",
          placeholders: "{name}"
        }
      ],
      qaIssues: []
    });

    expect(result.success).toBe(false);
  });
});
