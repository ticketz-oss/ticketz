import Whatsapp from "../../../models/Whatsapp";
import WhatsappStatusPost, {
  StatusKind
} from "../../../models/WhatsappStatusPost";

export type StatusCapabilityReason =
  "OFFICIAL_API" | "LIB_NOT_VERIFIED" | "DISCONNECTED";

export type StatusCapabilities = {
  publishStatus: boolean;
  kinds: StatusKind[];
  reason: null | StatusCapabilityReason;
  manualExport: boolean;
  ownPostsSync: false;
};

export class StatusPublishError extends Error {
  constructor(
    public code: string,
    public permanent: boolean
  ) {
    super(code);
  }
}

export interface StatusProvider {
  capabilities(connection: Whatsapp): StatusCapabilities;
  publish(
    post: WhatsappStatusPost,
    connection: Whatsapp,
    audience: string[]
  ): Promise<{ remoteMessageId: string }>;
}
