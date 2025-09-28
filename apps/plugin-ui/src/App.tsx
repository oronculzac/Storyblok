import { FormEvent, useMemo, useState } from "react";
import type { TranslationSegment } from "@storyblok/contracts";

interface ApiResponse {
  qaIssues: { segmentId: string; severity: string; message: string }[];
  translationSegments: { segmentId: string; translatedText: string }[];
  story: { id: number; name: string; slug: string };
}

const defaultSegments: TranslationSegment[] = [
  {
    segmentId: "headline",
    fieldPath: "content.hero.headline",
    originalText: "Welcome {{name}}",
    placeholders: ["{{name}}"]
  },
  {
    segmentId: "body",
    fieldPath: "content.hero.body",
    originalText: "Click %{cta} to continue",
    placeholders: ["%{cta}"]
  }
];

const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export const App = () => {
  const [spaceId, setSpaceId] = useState("123");
  const [storyId, setStoryId] = useState("567");
  const [targetLocale, setTargetLocale] = useState("fr");
  const [publish, setPublish] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [storyName, setStoryName] = useState("Translated Story");
  const [storySlug, setStorySlug] = useState("translated-story");
  const [storyContent, setStoryContent] = useState(() =>
    JSON.stringify({ content: { hero: { headline: "Welcome {{name}}", body: "Click %{cta} to continue" } } }, null, 2)
  );
  const [segments, setSegments] = useState(() => JSON.stringify(defaultSegments, null, 2));
  const [isSubmitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedSegments = useMemo(() => {
    try {
      const parsed = JSON.parse(segments) as TranslationSegment[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      return [];
    }
  }, [segments]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResponse(null);
    setSubmitting(true);

    try {
      const body = {
        spaceId: Number(spaceId),
        storyId,
        targetLocale,
        publish,
        groupId: groupId || undefined,
        storyName: storyName || undefined,
        storySlug: storySlug || undefined,
        storyContent: JSON.parse(storyContent),
        segments: parsedSegments
      };

      const res = await fetch(`${apiBase}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to translate story");
      }

      const payload = (await res.json()) as ApiResponse;
      setResponse(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <h1>Storyblok Translation Assistant</h1>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Space ID
          <input value={spaceId} onChange={(event) => setSpaceId(event.target.value)} required type="number" />
        </label>
        <label>
          Story ID
          <input value={storyId} onChange={(event) => setStoryId(event.target.value)} required />
        </label>
        <label>
          Target locale
          <input value={targetLocale} onChange={(event) => setTargetLocale(event.target.value)} required />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} /> Publish on save
        </label>
        <label>
          Group ID
          <input value={groupId} onChange={(event) => setGroupId(event.target.value)} placeholder="Optional" />
        </label>
        <label>
          Story name
          <input value={storyName} onChange={(event) => setStoryName(event.target.value)} placeholder="Optional" />
        </label>
        <label>
          Story slug
          <input value={storySlug} onChange={(event) => setStorySlug(event.target.value)} placeholder="Optional" />
        </label>
        <label className="wide">
          Story content JSON
          <textarea value={storyContent} onChange={(event) => setStoryContent(event.target.value)} rows={8} required />
        </label>
        <label className="wide">
          Segments JSON
          <textarea value={segments} onChange={(event) => setSegments(event.target.value)} rows={8} required />
        </label>
        <button type="submit" disabled={isSubmitting || parsedSegments.length === 0} className="submit">
          {isSubmitting ? "Translating…" : "Translate and Publish"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {response ? (
        <section className="results">
          <h2>Translation result</h2>
          <pre>{JSON.stringify(response.translationSegments, null, 2)}</pre>
          <h3>QA issues</h3>
          {response.qaIssues.length === 0 ? (
            <p>No QA issues detected.</p>
          ) : (
            <ul>
              {response.qaIssues.map((issue) => (
                <li key={`${issue.segmentId}-${issue.message}`}>
                  <strong>{issue.severity.toUpperCase()}:</strong> [{issue.segmentId}] {issue.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};
