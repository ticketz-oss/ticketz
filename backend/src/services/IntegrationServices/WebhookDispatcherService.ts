export const WEBHOOK_EVENTS = {
  TICKET_CREATED: "ticket.created",
  TICKET_UPDATED: "ticket.updated",
  TICKET_CLOSED: "ticket.closed",
  TICKET_TRANSFERRED: "ticket.transferred",
  MESSAGE_RECEIVED: "message.received",
  MESSAGE_SENT: "message.sent",
  CONTACT_CREATED: "contact.created",
  CONTACT_UPDATED: "contact.updated"
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function dispatchWebhook(
  companyId: number,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  // Stub — integração com N8N não configurada nesta instalação
}
