import { z } from "zod";

export const placeholderSchema = z.string().min(1, "Placeholder identifiers must be at least one character long");

export const translationSegmentSchema = z.object({
  segmentId: z.string().min(1, "Segment id is required"),
  fieldPath: z
    .string()
    .min(1, "fieldPath is required")
    .describe("Dot-notation path to the field inside story.content to update"),
  originalText: z.string(),
  placeholders: z.array(placeholderSchema).default([])
});

export const storyblokStoryContentSchema = z.record(z.any());

export const translationJobSchema = z.object({
  spaceId: z.number().int().positive("spaceId must be a positive integer"),
  storyId: z.string().min(1, "storyId is required"),
  targetLocale: z.string().min(2, "targetLocale is required"),
  publish: z.boolean().default(false),
  groupId: z.string().optional(),
  storyName: z.string().optional(),
  storySlug: z.string().optional(),
  storyContent: storyblokStoryContentSchema,
  segments: z.array(translationSegmentSchema).min(1, "At least one segment is required")
});

export const qaIssueSchema = z.object({
  segmentId: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  message: z.string().min(1)
});

export const llmTranslationSegmentSchema = z.object({
  segmentId: z.string().min(1),
  translatedText: z.string(),
  placeholders: z.array(placeholderSchema)
});

export const llmTranslationResponseSchema = z.object({
  translationSegments: z.array(llmTranslationSegmentSchema),
  qaIssues: z.array(qaIssueSchema)
});

export const storyblokUpdateResponseSchema = z.object({
  story: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    slug: z.string(),
    published_at: z.string().nullable()
  })
});

export type TranslationSegment = z.infer<typeof translationSegmentSchema>;
export type TranslationJob = z.infer<typeof translationJobSchema>;
export type QaIssue = z.infer<typeof qaIssueSchema>;
export type LlmTranslationSegment = z.infer<typeof llmTranslationSegmentSchema>;
export type LlmTranslationResponse = z.infer<typeof llmTranslationResponseSchema>;
export type StoryblokStoryContent = z.infer<typeof storyblokStoryContentSchema>;
