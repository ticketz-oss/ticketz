export interface Contact {
  id: number;
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  presence?: string;
  extraInfo?: { name: string; value: string }[];
  tags?: Tag[];
}

export interface Queue {
  id: number;
  name: string;
  color: string;
  greetingMessage?: string;
  outOfHoursMessage?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Whatsapp {
  id: number;
  name: string;
  status: string;
  number?: string;
  isDefault?: boolean;
  isPrivate?: boolean;
  qrcode?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  profile: "admin" | "user";
  queues?: Queue[];
  allowedWhatsappIds?: number[];
  online?: boolean;
}

export interface QuickMessage {
  id: number;
  shortcode: string;
  message: string;
  mediaPath?: string;
}

export interface TicketNote {
  id: number;
  note: string;
  userId: number;
  contactId: number;
  ticketId: number;
  createdAt: string;
  user?: { name: string };
}

export interface Message {
  id: string;
  ticketId: number;
  body: string;
  fromMe: boolean;
  read: boolean;
  mediaType?: "image" | "video" | "audio" | "document" | "application" | "vcard" | "location" | "reactionMessage" | string | null;
  mediaUrl?: string;
  createdAt: string;
  updatedAt?: string;
  dataJson?: string;
  ack?: number;
  quotedMsgId?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  reactions?: string[];
  quotedMsg?: {
    id: string;
    body: string;
    contact?: {
      name: string;
    };
  } | null;
  contact?: Contact;
}

export interface Ticket {
  id: number;
  uuid: string;
  status: "open" | "pending" | "closed";
  lastMessage?: string;
  unreadMessages?: number;
  updatedAt: string;
  contact: Contact;
  contactId?: number;
  queue?: Queue | null;
  queueId?: number | null;
  user?: User | null;
  userId?: number | null;
  whatsapp?: Whatsapp | null;
  whatsappId?: number | null;
  isGroup?: boolean;
  tags?: Tag[];
}

export interface MediaUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video" | "audio" | "document";
  caption: string;
  name: string;
  size: number;
}
