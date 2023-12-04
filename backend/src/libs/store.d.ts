import {
  WASocket,
  BaileysEventEmitter,
  Chat,
  ConnectionState,
  Contact,
  GroupMetadata,
  PresenceData,
  proto,
  WAMessageCursor,
  WAMessageKey,
  WASocket
} from "@adiwajshing/baileys";
import KeyedDB from "@adiwajshing/keyed-db";

export interface Store {
  chats: KeyedDB<Chat, string>;
  contacts: {
    [_: string]: Contact;
  };
  messages: {
    [_: string]: {
      array: proto.IWebMessageInfo[];
      get: (id: string) => proto.IWebMessageInfo;
      upsert: (item: proto.IWebMessageInfo, mode: "append" | "prepend") => void;
      update: (item: proto.IWebMessageInfo) => boolean;
      remove: (item: proto.IWebMessageInfo) => boolean;
      updateAssign: (
        id: string,
        update: Partial<proto.IWebMessageInfo>
      ) => boolean;
      clear: () => void;
      filter: (contain: (item: proto.IWebMessageInfo) => boolean) => void;
      toJSON: () => proto.IWebMessageInfo[];
      fromJSON: (newItems: proto.IWebMessageInfo[]) => void;
    };
  };
  groupMetadata: {
    [_: string]: GroupMetadata;
  };
  state: ConnectionState;
  presences: {
    [id: string]: {
      [participant: string]: PresenceData;
    };
  };
  bind: (ev: BaileysEventEmitter) => void;
  loadMessages: (
    jid: string,
    count: number,
    cursor: WAMessageCursor,
    sock: WASocket | undefined
  ) => Promise<proto.IWebMessageInfo[]>;
  loadMessage: (
    jid: string,
    id: string,
    sock: WASocket | undefined
  ) => Promise<proto.IWebMessageInfo>;
  mostRecentMessage: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<proto.IWebMessageInfo>;
  fetchImageUrl: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<string>;
  fetchGroupMetadata: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<GroupMetadata>;
  fetchBroadcastListInfo: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<GroupMetadata>;
  fetchMessageReceipts: (
    { remoteJid, id }: WAMessageKey,
    sock: WASocket | undefined
  ) => Promise<proto.IUserReceipt[]>;
  toJSON: () => {
    chats: KeyedDB<Chat, string>;
    contacts: {
      [_: string]: Contact;
    };
    messages: {
      [_: string]: {
        array: proto.IWebMessageInfo[];
        get: (id: string) => proto.IWebMessageInfo;
        upsert: (
          item: proto.IWebMessageInfo,
          mode: "append" | "prepend"
        ) => void;
        update: (item: proto.IWebMessageInfo) => boolean;
        remove: (item: proto.IWebMessageInfo) => boolean;
        updateAssign: (
          id: string,
          update: Partial<proto.IWebMessageInfo>
        ) => boolean;
        clear: () => void;
        filter: (contain: (item: proto.IWebMessageInfo) => boolean) => void;
        toJSON: () => proto.IWebMessageInfo[];
        fromJSON: (newItems: proto.IWebMessageInfo[]) => void;
      };
    };
  };
  fromJSON: (json: {
    chats: Chat[];
    contacts: {
      [id: string]: Contact;
    };
    messages: {
      [id: string]: proto.IWebMessageInfo[];
    };
  }) => void;
  writeToFile: (path: string) => void;
  readFromFile: (path: string) => void;
}
