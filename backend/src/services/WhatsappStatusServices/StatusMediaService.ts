// Stub created by the shared scaffold; Task 4 implements it.
export type StatusMediaMime =
  "image/jpeg" | "image/png" | "image/webp" | "video/mp4";

export const sniffMime = (_buffer: Buffer): StatusMediaMime | null => {
  throw new Error("not implemented");
};

export const storeStatusMedia = async (
  _companyId: number,
  _kind: "image" | "video",
  _tmpFilePath: string
): Promise<{ mediaPath: string; mediaMime: string }> => {
  throw new Error("not implemented");
};

export const resolveStatusMediaPath = (
  _companyId: number,
  _mediaPath: string
): string => {
  throw new Error("not implemented");
};

export const removeStatusMedia = async (
  _companyId: number,
  _mediaPath: string
): Promise<void> => {
  throw new Error("not implemented");
};

export const cleanupOrphanStatusMedia = async (
  _now: Date = new Date()
): Promise<number> => {
  throw new Error("not implemented");
};
