const normalizeMediaCaption = (body: unknown): string =>
  typeof body === "string" ? body.trim() : "";

export default normalizeMediaCaption;
