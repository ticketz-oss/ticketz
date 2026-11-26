const pendingStartCounts = new Map<number, number>();

export const isWhatsAppSessionStartPending = (whatsappId: number): boolean =>
  (pendingStartCounts.get(whatsappId) || 0) > 0;

export const beginWhatsAppSessionStart = (whatsappId: number): (() => void) => {
  pendingStartCounts.set(
    whatsappId,
    (pendingStartCounts.get(whatsappId) || 0) + 1
  );

  return () => {
    const pendingCount = (pendingStartCounts.get(whatsappId) || 1) - 1;
    if (pendingCount > 0) {
      pendingStartCounts.set(whatsappId, pendingCount);
    } else {
      pendingStartCounts.delete(whatsappId);
    }
  };
};
