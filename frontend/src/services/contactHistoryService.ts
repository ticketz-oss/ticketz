import api from "./api";
import type { Ticket, Message } from "../types";

/**
 * Loads the complete messages history for a contact across all tickets (past and present).
 * If the ticket is a group or has no contactId, returns only the current ticket's messages.
 */
export async function loadContactMessagesHistory(
  ticket: Ticket,
  markAsRead: boolean = true,
  providedQueueIds?: number[]
): Promise<Message[]> {
  try {
    // 1. Fetch current ticket messages
    const currentRes = await api.get<any>(`/messages/${ticket.id}`, {
      params: { markAsRead: markAsRead ? "true" : "false" },
    });

    const currentMsgs: Message[] = Array.isArray(currentRes.data)
      ? currentRes.data
      : Array.isArray(currentRes.data?.messages)
      ? currentRes.data.messages
      : [];

    // If it's a group or has no contactId, return current messages directly
    if (ticket.isGroup || !ticket.contactId) {
      return currentMsgs;
    }

    // 2. Determine queue IDs (Ticketz backend filters out all tickets if queueIds is omitted!)
    let qIds: number[] = providedQueueIds && providedQueueIds.length > 0 ? [...providedQueueIds] : [];
    if (qIds.length === 0) {
      try {
        const qRes = await api.get<any[]>("/queue");
        if (Array.isArray(qRes.data) && qRes.data.length > 0) {
          qIds = qRes.data.map((q) => q.id);
        }
      } catch {}
    }
    if (qIds.length === 0) {
      // Fallback safe range of queue IDs
      qIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }

    // 3. Fetch other tickets of this contact using queueIds
    try {
      const ticketsRes = await api.get<any>("/tickets", {
        params: {
          contactId: ticket.contactId,
          showAll: "true",
          all: "true",
          queueIds: JSON.stringify(qIds),
        },
      });

      const list: Ticket[] = Array.isArray(ticketsRes.data)
        ? ticketsRes.data
        : Array.isArray(ticketsRes.data?.tickets)
        ? ticketsRes.data.tickets
        : [];

      // Filter for other tickets belonging to this contact
      const otherTickets = list
        .filter((t) => t.id !== ticket.id)
        .sort((a, b) => b.id - a.id); // newest previous tickets first

      if (otherTickets.length === 0) {
        return currentMsgs;
      }

      // Fetch messages from up to 15 previous tickets in parallel
      const ticketsToFetch = otherTickets.slice(0, 15);
      const prevResponses = await Promise.allSettled(
        ticketsToFetch.map((t) =>
          api.get<any>(`/messages/${t.id}`, {
            params: { markAsRead: "false" },
          })
        )
      );

      const messageMap = new Map<string, Message>();

      // Add previous messages first
      for (const res of prevResponses) {
        if (res.status === "fulfilled") {
          const prevList: Message[] = Array.isArray(res.value.data)
            ? res.value.data
            : Array.isArray(res.value.data?.messages)
            ? res.value.data.messages
            : [];
          for (const m of prevList) {
            messageMap.set(String(m.id), m);
          }
        }
      }

      // Add current ticket messages (overriding any overlaps)
      for (const m of currentMsgs) {
        messageMap.set(String(m.id), m);
      }

      // Sort chronologically oldest to newest
      const sorted = Array.from(messageMap.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return sorted;
    } catch (err) {
      console.warn("Could not fetch previous tickets history:", err);
      return currentMsgs;
    }
  } catch (err) {
    console.error("Error loading messages:", err);
    return [];
  }
}
