import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useWhatsappStatus from "./useWhatsappStatus";
import StoryViewer from "./StoryViewer";
import NewStoryModal from "./NewStoryModal";
import { CheckIcon, ClockIcon, PlusIcon } from "./icons";
import { initialsOf, loadSeen, markSeen, ringGradient, t } from "./storyState";
import "./whatsappStatus.css";

const TOAST_MS = 4000;
const TOAST_KEYS = {
  publish: "whatsappStatus.toast.published",
  schedule: "whatsappStatus.toast.scheduled",
  draft: "whatsappStatus.toast.draftSaved"
};

// "Meus stories" strip at the top of the ticket list column.
const StoriesStrip = ({ companyId, userId }) => {
  const { enabled, connections, postsByConnection, applyPost } =
    useWhatsappStatus(companyId);
  const [seen, setSeen] = useState(() => loadSeen(userId));
  const [viewing, setViewing] = useState(null);
  const [composing, setComposing] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => setSeen(loadSeen(userId)), [userId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const ringConnections = useMemo(
    () =>
      connections.filter(
        connection => (postsByConnection[connection.id] || []).length > 0
      ),
    [connections, postsByConnection]
  );

  const handleSeen = useCallback(
    id => {
      if (seen.has(id)) return;
      setSeen(markSeen(userId, [id]));
    },
    [seen, userId]
  );

  const closeViewer = useCallback(() => setViewing(null), []);

  const openCompose = whatsappId => {
    setViewing(null);
    setToast(null);
    setComposing({ whatsappId: whatsappId || null });
  };

  const handleSaved = ({ post, action, connection }) => {
    applyPost(post);
    if (action !== "draft") setComposing(null);
    setToast(
      t(TOAST_KEYS[action] || TOAST_KEYS.publish, {
        name: connection?.name || ""
      })
    );
  };

  if (!enabled) return null;

  return (
    <div className="ews-strip">
      <div className="ews-strip-head">
        <span className="ews-eyebrow">{t("whatsappStatus.strip.title")}</span>
        <span className="ews-ttl">
          <ClockIcon />
          {t("whatsappStatus.strip.ttl")}
        </span>
      </div>
      <div className="ews-rings">
        <button
          type="button"
          className="ews-story-btn"
          onClick={() => openCompose(null)}
        >
          <span className="ews-new-ring">
            <PlusIcon />
          </span>
          <span className="ews-story-name">
            {t("whatsappStatus.strip.newStory")}
          </span>
        </button>
        {ringConnections.map((connection, connIndex) => {
          const posts = postsByConnection[connection.id];
          const allSeen = posts.every(post => seen.has(post.id));
          return (
            <button
              key={connection.id}
              type="button"
              className="ews-story-btn"
              aria-label={t("whatsappStatus.strip.ringAria", {
                name: connection.name,
                total: posts.length
              })}
              onClick={() => setViewing({ connIndex, postIndex: 0 })}
            >
              <span
                className="ews-ring"
                data-testid="story-ring"
                data-segments={posts.length}
                data-seen={allSeen ? "true" : "false"}
                style={{
                  background: ringGradient(
                    posts.length,
                    allSeen,
                    "var(--ew-surface, #FFFFFF)"
                  )
                }}
              >
                <span className="ews-ring-inner">
                  {initialsOf(connection.name)}
                </span>
              </span>
              <span className="ews-story-name">{connection.name}</span>
            </button>
          );
        })}
      </div>

      {viewing && (
        <StoryViewer
          connections={ringConnections}
          postsByConnection={postsByConnection}
          start={viewing}
          onClose={closeViewer}
          onNew={openCompose}
          onPostChange={applyPost}
          onSeen={handleSeen}
        />
      )}

      {composing && (
        <NewStoryModal
          defaultWhatsappId={composing.whatsappId}
          onClose={() => setComposing(null)}
          onSaved={handleSaved}
        />
      )}

      {toast &&
        createPortal(
          <div className="ews-toast" role="status">
            <CheckIcon />
            {toast}
          </div>,
          document.body
        )}
    </div>
  );
};

export default StoriesStrip;
