import {
  StatusCapabilities,
  StatusProvider,
  StatusPublishError
} from "./types";

// The Meta Cloud API has no documented endpoint to publish a Status. This
// adapter only reports that, so drafts, previews and manual download keep
// working. It must never call /messages or open a Web session as a substitute.
const OFFICIAL_CAPABILITIES: StatusCapabilities = {
  publishStatus: false,
  kinds: [],
  reason: "OFFICIAL_API",
  manualExport: true,
  ownPostsSync: false
};

const OfficialStatusProvider: StatusProvider = {
  capabilities: () => ({ ...OFFICIAL_CAPABILITIES, kinds: [] }),
  publish: async () => {
    throw new StatusPublishError("ERR_STATUS_UNSUPPORTED", true);
  }
};

export default OfficialStatusProvider;
