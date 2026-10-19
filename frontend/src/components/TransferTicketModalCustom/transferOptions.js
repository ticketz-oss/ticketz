export const filterTransferQueues = (
  connections,
  selectedWhatsappId,
  selectedUser
) => {
  const connection = connections.find(item => item.id === selectedWhatsappId);
  const connectionQueues = connection?.queues || [];

  if (!selectedUser || !Array.isArray(selectedUser.queues)) {
    return connectionQueues;
  }

  const userQueueIds = new Set(selectedUser.queues.map(queue => queue.id));
  return connectionQueues.filter(queue => userQueueIds.has(queue.id));
};

export const shouldShowConnectionSelection = (connections, isGroup) =>
  connections.length > 1 && !isGroup;
