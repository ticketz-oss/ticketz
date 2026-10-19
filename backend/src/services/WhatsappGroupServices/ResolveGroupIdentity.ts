export const getGroupContactCacheKey = (
  companyId: number,
  whatsappId: number,
  remoteJid: string
): string => `${companyId}:${whatsappId}:${remoteJid}`;

export const resolveGroupIdentity = async (
  remoteJid: string,
  loadMetadata: () => Promise<{ subject?: string }>,
  onMetadataError?: (error: unknown) => void
): Promise<{ id: string; name: string; metadataLoaded: boolean }> => {
  const temporaryName = `Grupo ${remoteJid.split("@")[0]}`;
  try {
    const metadata = await loadMetadata();
    return {
      id: remoteJid,
      name: metadata.subject || temporaryName,
      metadataLoaded: true
    };
  } catch (error) {
    onMetadataError?.(error);
    return { id: remoteJid, name: temporaryName, metadataLoaded: false };
  }
};
