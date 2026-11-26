export function isCurrentSession(
  activeSessionId: string | null | undefined,
  expectedSessionId: string,
  socketIsCurrent = true
): boolean {
  return (
    Boolean(expectedSessionId) &&
    activeSessionId === expectedSessionId &&
    socketIsCurrent
  );
}
