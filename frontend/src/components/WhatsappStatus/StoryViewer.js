import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import Layer from "./Layer";
import downloadStoryMedia from "./downloadStoryMedia";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  ImageIcon,
  InfoIcon
} from "./icons";
import {
  MEDIA_BACKGROUND,
  STORY_BLUE,
  failureMessage,
  formatAgo,
  formatExpiresIn,
  formatPostedAt,
  initialsOf,
  storyStateLabel,
  t
} from "./storyState";

// The server cancels anything that has not reached the session yet.
const CANCELLABLE = ["draft", "queued", "failed", "unsupported"];

const audienceText = post => {
  const label =
    post.audienceMode === "contact_list"
      ? t("whatsappStatus.viewer.audienceList")
      : t("whatsappStatus.viewer.audienceAll");
  return Number.isFinite(post.audienceCount)
    ? `${label} (${post.audienceCount})`
    : label;
};

const useMediaUrl = post => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const id = post?.id;
  const hasMedia = Boolean(post?.hasMedia) && post?.kind !== "text";

  useEffect(() => {
    setUrl(null);
    setFailed(false);
    if (!hasMedia) return undefined;
    let active = true;
    let objectUrl = null;
    api
      .get(`/whatsapp-status/posts/${id}/media`, { responseType: "blob" })
      .then(({ data }) => {
        if (!active || typeof URL.createObjectURL !== "function") return;
        objectUrl = URL.createObjectURL(data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(objectUrl);
    };
  }, [id, hasMedia]);

  return { url, failed };
};

const StoryViewer = ({
  connections,
  postsByConnection,
  start,
  onClose,
  onNew,
  onEdit,
  onPostChange,
  onSeen
}) => {
  const [position, setPosition] = useState({
    connIndex: start?.connIndex || 0,
    postIndex: start?.postIndex || 0
  });
  const [busy, setBusy] = useState(false);

  const connection = connections[position.connIndex];
  const list = (connection && postsByConnection[connection.id]) || [];
  const postIndex = Math.min(position.postIndex, list.length - 1);
  const post = postIndex >= 0 ? list[postIndex] : null;
  const media = useMediaUrl(post);

  // A story that disappears (cancelled, expired) moves the viewer along, and
  // the viewer closes once there is nothing left to show.
  useEffect(() => {
    if (post) return;
    const next = connections.findIndex(
      item => (postsByConnection[item.id] || []).length > 0
    );
    if (next === -1) onClose();
    else setPosition({ connIndex: next, postIndex: 0 });
  }, [post, connections, postsByConnection, onClose]);

  useEffect(() => {
    if (post && onSeen) onSeen(post.id);
  }, [post, onSeen]);

  const lengthOf = index =>
    (postsByConnection[connections[index]?.id] || []).length;

  const goPrev = useCallback(() => {
    if (postIndex > 0) {
      setPosition({ connIndex: position.connIndex, postIndex: postIndex - 1 });
      return;
    }
    for (let index = position.connIndex - 1; index >= 0; index -= 1) {
      if (lengthOf(index) > 0) {
        setPosition({ connIndex: index, postIndex: lengthOf(index) - 1 });
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postIndex, position.connIndex, connections, postsByConnection]);

  const goNext = useCallback(() => {
    if (postIndex < list.length - 1) {
      setPosition({ connIndex: position.connIndex, postIndex: postIndex + 1 });
      return;
    }
    for (
      let index = position.connIndex + 1;
      index < connections.length;
      index += 1
    ) {
      if (lengthOf(index) > 0) {
        setPosition({ connIndex: index, postIndex: 0 });
        return;
      }
    }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postIndex, list.length, position.connIndex, connections, onClose]);

  const isFirst =
    postIndex <= 0 &&
    !connections.slice(0, position.connIndex).some((_, i) => lengthOf(i) > 0);

  const handleKeyDown = event => {
    if (event.key === "ArrowLeft") goPrev();
    if (event.key === "ArrowRight") goNext();
  };

  const handleDelete = async () => {
    if (!post || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/whatsapp-status/posts/${post.id}/cancel`
      );
      if (onPostChange) onPostChange(data);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!post || busy) return;
    setBusy(true);
    try {
      await downloadStoryMedia(post);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!connection || !post) return null;

  const name = connection.name;
  const initials = initialsOf(name);
  const stateKey = storyStateLabel(post);
  const isText = post.kind === "text";
  const background = isText
    ? post.backgroundColor || STORY_BLUE
    : MEDIA_BACKGROUND;
  const isDraft = post.state === "draft";
  const canDownload = isDraft && !isText && Boolean(post.hasMedia);
  const showFailure =
    (post.state === "failed" || post.state === "unsupported") &&
    post.failureCode;

  return (
    <Layer
      className="ews-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={t("whatsappStatus.viewer.aria")}
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="ews-nav-dark ews-viewer-close"
        aria-label={t("whatsappStatus.viewer.close")}
        onClick={onClose}
      >
        <CloseIcon />
      </button>

      <button
        type="button"
        className="ews-nav-dark"
        aria-label={t("whatsappStatus.viewer.prev")}
        onClick={goPrev}
        disabled={isFirst}
      >
        <ChevronLeftIcon />
      </button>

      <div className="ews-card" style={{ background }}>
        <div className="ews-bars">
          {list.map((item, index) => (
            <span
              key={item.id}
              className="ews-bar"
              style={{
                background:
                  index <= postIndex
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.35)"
              }}
            />
          ))}
        </div>
        <div className="ews-card-head">
          <span
            className="ews-avatar"
            style={{ width: 34, height: 34, fontSize: 12 }}
          >
            {initials}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
              {name}
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}>
              {post.publishedAt ? formatAgo(post.publishedAt) : t(stateKey)}
            </div>
          </div>
        </div>
        {isText ? (
          <div className="ews-card-text">{post.body}</div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              className={`ews-card-media${media.url ? "" : " ews-card-media--empty"}`}
            >
              {media.url && post.kind === "video" && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={media.url} controls autoPlay playsInline />
              )}
              {media.url && post.kind !== "video" && (
                <img
                  src={media.url}
                  alt={t("whatsappStatus.viewer.imageAlt")}
                />
              )}
              {!media.url && (
                <>
                  <ImageIcon size={30} />
                  {media.failed || !post.hasMedia
                    ? t("whatsappStatus.viewer.mediaUnavailable")
                    : ""}
                </>
              )}
            </div>
            {post.body ? (
              <div className="ews-card-caption">{post.body}</div>
            ) : (
              <div style={{ height: 22 }} />
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="ews-nav-dark"
        aria-label={t("whatsappStatus.viewer.next")}
        onClick={goNext}
      >
        <ChevronRightIcon />
      </button>

      <aside
        className="ews-details"
        aria-label={t("whatsappStatus.viewer.details")}
      >
        <div className="ews-details-title">
          {t("whatsappStatus.viewer.details")}
        </div>
        <dl>
          <dt>{t("whatsappStatus.viewer.connection")}</dt>
          <dd>{name}</dd>
          <dt>{t("whatsappStatus.viewer.publishedAt")}</dt>
          <dd>{formatPostedAt(post.publishedAt)}</dd>
          <dt>{t("whatsappStatus.viewer.expiresIn")}</dt>
          <dd>{formatExpiresIn(post.expiresAt)}</dd>
          <dt>{t("whatsappStatus.viewer.publishedBy")}</dt>
          <dd>{post.createdBy?.name || t("whatsappStatus.time.none")}</dd>
          <dt>{t("whatsappStatus.viewer.audience")}</dt>
          <dd>{audienceText(post)}</dd>
          <dt>{t("whatsappStatus.viewer.state")}</dt>
          <dd>
            {t(stateKey)}
            {showFailure && (
              <span className="ews-failure">
                {failureMessage(post.failureCode)}
              </span>
            )}
          </dd>
        </dl>
        <div className="ews-note">
          <InfoIcon />
          <span>{t("whatsappStatus.viewer.noViewers")}</span>
        </div>
        <div className="ews-details-actions">
          <button
            type="button"
            className="ews-btn-primary"
            onClick={() => onNew(connection.id)}
          >
            {t("whatsappStatus.viewer.publishNew")}
          </button>
          {isDraft && onEdit && (
            <button
              type="button"
              className="ews-btn-ghost"
              onClick={() => onEdit(post)}
              disabled={busy}
            >
              {t("whatsappStatus.viewer.editDraft")}
            </button>
          )}
          {canDownload && (
            <button
              type="button"
              className="ews-btn-ghost"
              onClick={handleDownload}
              disabled={busy}
            >
              <DownloadIcon />
              {t("whatsappStatus.viewer.download")}
            </button>
          )}
          {CANCELLABLE.includes(post.state) && (
            <button
              type="button"
              className="ews-btn-danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {t("whatsappStatus.viewer.delete")}
            </button>
          )}
        </div>
      </aside>
    </Layer>
  );
};

export default StoryViewer;
