import { FastifyInstance } from "fastify";
import { translationJobSchema } from "@storyblok/contracts";
import { findMissingPlaceholders } from "@storyblok/utils";
import { TranslationLlmClient } from "./llm.js";
import { applyTranslationsToContent, updateStoryInStoryblok } from "./storyblok.js";
import { prisma } from "./prisma.js";

interface RouteDependencies {
  llmClient: TranslationLlmClient;
  storyblokToken: string;
}

export const registerRoutes = (app: FastifyInstance, deps: RouteDependencies) => {
  app.post("/api/translate", async (request, reply) => {
    const parseResult = translationJobSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Invalid payload",
        details: parseResult.error.flatten()
      });
    }

    const job = parseResult.data;

    const llmResponse = await deps.llmClient.translate(job);
    const segmentDefinition = new Map(job.segments.map((segment) => [segment.segmentId, segment]));
    const qaIssues = [...llmResponse.qaIssues];

    for (const segment of llmResponse.translationSegments) {
      const definition = segmentDefinition.get(segment.segmentId);
      if (!definition) {
        qaIssues.push({
          segmentId: segment.segmentId,
          severity: "error",
          message: "Received translation for unknown segment"
        });
        continue;
      }

      const missingPlaceholders = findMissingPlaceholders(definition.placeholders, segment.translatedText);
      if (missingPlaceholders.length > 0) {
        qaIssues.push({
          segmentId: segment.segmentId,
          severity: "error",
          message: `Missing placeholders: ${missingPlaceholders.join(", ")}`
        });
      }

      const extraneous = segment.placeholders.filter(
        (placeholder) => !definition.placeholders.includes(placeholder)
      );
      if (extraneous.length > 0) {
        qaIssues.push({
          segmentId: segment.segmentId,
          severity: "warning",
          message: `Unexpected placeholders in translation: ${extraneous.join(", ")}`
        });
      }
    }

    const content = applyTranslationsToContent(job, llmResponse.translationSegments);
    const storyblokResponse = await updateStoryInStoryblok(job, content, deps.storyblokToken);

    await prisma.translationLog.create({
      data: {
        storyId: job.storyId,
        targetLocale: job.targetLocale,
        job,
        llmResponse,
        storyblokBody: storyblokResponse
      }
    });

    return reply.send({
      story: storyblokResponse.story,
      translationSegments: llmResponse.translationSegments,
      qaIssues
    });
  });
};
