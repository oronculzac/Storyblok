import OpenAI from "openai";
import {
  LlmTranslationResponse,
  TranslationJob,
  llmTranslationResponseSchema
} from "@storyblok/contracts";

const translationResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    translationSegments: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          segmentId: { type: "string" },
          translatedText: { type: "string" },
          placeholders: {
            type: "array",
            items: { type: "string" },
            additionalItems: false
          }
        },
        required: ["segmentId", "translatedText", "placeholders"]
      }
    },
    qaIssues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          segmentId: { type: "string" },
          severity: { type: "string", enum: ["info", "warning", "error"] },
          message: { type: "string" }
        },
        required: ["segmentId", "severity", "message"]
      }
    }
  },
  required: ["translationSegments", "qaIssues"]
} as const;

const buildPrompt = (job: TranslationJob): string => {
  const segmentList = job.segments
    .map((segment) => `- ID: ${segment.segmentId}\n  Field Path: ${segment.fieldPath}\n  Original: ${segment.originalText}\n  Placeholders: ${segment.placeholders.join(", ") || "(none)"}`)
    .join("\n\n");

  return [
    `You are a senior localization specialist translating Storyblok content to ${job.targetLocale}.`,
    "Translate each segment while preserving the exact placeholders. Return JSON only.",
    "If a translation might be problematic, include a QA issue with severity info|warning|error.",
    "Segments:",
    segmentList
  ].join("\n\n");
};

const parseStructuredResponse = (raw: string): LlmTranslationResponse => {
  const parsed = JSON.parse(raw);
  return llmTranslationResponseSchema.parse(parsed);
};

export class TranslationLlmClient {
  constructor(private readonly openai: OpenAI) {}

  async translate(job: TranslationJob): Promise<LlmTranslationResponse> {
    const prompt = buildPrompt(job);
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.openai.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: [
                {
                  type: "text",
                  text: "You respond strictly in JSON following the provided schema."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                }
              ]
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "TranslationQaResult",
              schema: translationResponseJsonSchema,
              strict: true
            }
          }
        });

        const outputText = response.output_text;
        if (!outputText) {
          throw new Error("OpenAI response did not include output text");
        }

        return parseStructuredResponse(outputText);
      } catch (error) {
        lastError = error;
        if (attempt === 1) {
          break;
        }
      }
    }

    throw new Error(`Unable to produce a valid translation payload: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }
}
