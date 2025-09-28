export const setValueAtPath = (target: Record<string, any>, path: string, value: unknown): void => {
  const segments = path.split(".").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) {
    throw new Error("fieldPath must contain at least one segment");
  }

  let current: Record<string, any> = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (!(segment in current) || typeof current[segment] !== "object" || current[segment] === null) {
      current[segment] = {};
    }
    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
};
