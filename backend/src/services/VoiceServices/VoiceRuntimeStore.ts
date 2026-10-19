type QRWaiter = (value: string) => void;

const qrBySession = new Map<string, string>();
const waitersBySession = new Map<string, Set<QRWaiter>>();

export const setVoiceQR = (sessionId: string, qr: string): void => {
  if (!sessionId || !qr) return;
  qrBySession.set(sessionId, qr);
  const waiters = waitersBySession.get(sessionId);
  if (!waiters) return;
  waiters.forEach(resolve => resolve(qr));
  waitersBySession.delete(sessionId);
};

export const clearVoiceQR = (sessionId: string): void => {
  qrBySession.delete(sessionId);
};

export const waitForVoiceQR = async (
  sessionId: string,
  timeoutMs = 15000
): Promise<string | null> => {
  const current = qrBySession.get(sessionId);
  if (current) return current;

  return new Promise(resolve => {
    const waiters = waitersBySession.get(sessionId) || new Set<QRWaiter>();
    const done: QRWaiter = value => {
      clearTimeout(timer);
      waiters.delete(done);
      resolve(value);
    };
    const timer = setTimeout(() => {
      waiters.delete(done);
      if (waiters.size === 0) waitersBySession.delete(sessionId);
      resolve(null);
    }, timeoutMs);
    waiters.add(done);
    waitersBySession.set(sessionId, waiters);
  });
};
