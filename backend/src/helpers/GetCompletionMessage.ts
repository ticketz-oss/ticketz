const getCompletionMessage = (
  configuredMessage?: string | null
): string | null => {
  const message = configuredMessage?.trim();

  return message || null;
};

export default getCompletionMessage;
