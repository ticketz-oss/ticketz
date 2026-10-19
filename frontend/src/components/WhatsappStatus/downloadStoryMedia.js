import api from "../../services/api";

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4"
};

const extensionOf = post =>
  EXTENSIONS[post?.mediaMime] || (post?.kind === "video" ? "mp4" : "jpg");

// Fetches the stored file of a post as an attachment and hands it to the
// browser, for publishing it by hand from the WhatsApp app.
const downloadStoryMedia = async post => {
  const { data } = await api.get(`/whatsapp-status/posts/${post.id}/media`, {
    params: { download: 1 },
    responseType: "blob"
  });
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `story-${post.id}.${extensionOf(post)}`;
  document.body.appendChild(link);
  try {
    link.click();
  } catch (_) {
    // jsdom and some embedded browsers have no navigation.
  }
  link.remove();
  setTimeout(() => {
    if (typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
  }, 1000);
};

export default downloadStoryMedia;
