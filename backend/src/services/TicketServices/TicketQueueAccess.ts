export const shouldApplyQueueFilter = (
  profile: string,
  queueIds: number[]
): boolean => profile !== "admin" || queueIds.length > 0;
