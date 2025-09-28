import {
  LlmTranslationSegment,
  StoryblokStoryContent,
  TranslationJob,
  storyblokUpdateResponseSchema
} from "@storyblok/contracts";
import { setValueAtPath } from "@storyblok/utils";

const cloneContent = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export const applyTranslationsToContent = (
  job: TranslationJob,
  translatedSegments: LlmTranslationSegment[]
): StoryblokStoryContent => {
  const content = cloneContent(job.storyContent);
  const segmentDefinition = new Map(job.segments.map((segment) => [segment.segmentId, segment]));

  translatedSegments.forEach((segment) => {
    const definition = segmentDefinition.get(segment.segmentId);
    if (!definition) {
      return;
    }
    setValueAtPath(content, definition.fieldPath, segment.translatedText);
  });

  return content;
};

export const updateStoryInStoryblok = async (
  job: TranslationJob,
  content: StoryblokStoryContent,
  token: string
) => {
  const url = new URL(`https://mapi.storyblok.com/v1/spaces/${job.spaceId}/stories/${job.storyId}`);
  if (job.publish) {
    url.searchParams.set("publish", "1");
  }

  const body = {
    story: {
      content,
      lang: job.targetLocale,
      ...(job.groupId ? { group_id: job.groupId } : {}),
      ...(job.storyName ? { name: job.storyName } : {}),
      ...(job.storySlug ? { slug: job.storySlug } : {})
    }
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Storyblok update failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  return storyblokUpdateResponseSchema.parse(payload);
};
