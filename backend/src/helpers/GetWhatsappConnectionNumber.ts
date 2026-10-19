type WhatsappSession = {
  creds?: {
    me?: {
      id?: string;
    };
  };
};

const getWhatsappConnectionNumber = (session: unknown): string | null => {
  if (!session) return null;

  try {
    const parsed = (
      typeof session === "string" ? JSON.parse(session) : session
    ) as WhatsappSession;
    const jid = parsed?.creds?.me?.id;

    if (typeof jid !== "string") return null;

    const user = jid.split(":", 1)[0].split("@", 1)[0].replace(/\D/g, "");
    return user || null;
  } catch {
    return null;
  }
};

export default getWhatsappConnectionNumber;
