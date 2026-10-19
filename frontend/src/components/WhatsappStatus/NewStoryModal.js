import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import api from "../../services/api";
import Layer from "./Layer";
import downloadStoryMedia from "./downloadStoryMedia";
import {
  CalendarIcon,
  CloseIcon,
  DownloadIcon,
  ImageIcon,
  InfoIcon,
  SendIcon
} from "./icons";
import {
  MEDIA_BACKGROUND,
  STORY_COLORS,
  TEXT_LIMIT,
  failureMessage,
  formatPhone,
  initialsOf,
  t
} from "./storyState";

const KINDS = ["text", "image", "video"];
const ACCEPT = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4"
};
const MAX_LIST_PAGES = 10;

const newIdempotencyKey = () =>
  window.crypto && typeof window.crypto.randomUUID === "function"
    ? window.crypto.randomUUID()
    : uuidv4();

const pad = value => String(value).padStart(2, "0");
const toLocalInput = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const errorText = err => {
  const code = err?.response?.data?.error;
  return code ? failureMessage(code) : t("whatsappStatus.modal.genericError");
};

const fileMatchesKind = (file, kind) =>
  kind === "video"
    ? file.type === "video/mp4"
    : ACCEPT.image.split(",").includes(file.type);

const pickDefaultConnection = (list, preferredId) => {
  if (preferredId && list.some(item => item.id === preferredId))
    return preferredId;
  const publishable = list.find(item => item.capabilities?.publishStatus);
  return (publishable || list[0])?.id ?? null;
};

// Why a connection cannot publish this kind right now, or null when it can.
const blockReason = (connection, kind) => {
  if (!connection) return null;
  const capabilities = connection.capabilities || {};
  if (!capabilities.publishStatus)
    return capabilities.reason || "LIB_NOT_VERIFIED";
  if (Array.isArray(capabilities.kinds) && !capabilities.kinds.includes(kind))
    return "LIB_NOT_VERIFIED";
  return null;
};

const colorIndexOf = hex => {
  const index = STORY_COLORS.findIndex(
    color => color.hex.toLowerCase() === String(hex || "").toLowerCase()
  );
  return index === -1 ? 0 : index;
};

// With `post` the modal edits that existing draft: it starts prefilled, saves
// with PUT and never creates another post.
const NewStoryModal = ({
  defaultWhatsappId,
  post: editing,
  onClose,
  onSaved
}) => {
  const idempotencyKey = useRef(newIdempotencyKey());
  const fileInput = useRef(null);
  const editingText = editing?.kind === "text";
  const [connections, setConnections] = useState([]);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);
  const [whatsappId, setWhatsappId] = useState(null);
  const [kind, setKind] = useState(editing?.kind || "text");
  const [text, setText] = useState(editingText ? editing.body || "" : "");
  const [colorIndex, setColorIndex] = useState(() =>
    editingText ? colorIndexOf(editing.backgroundColor) : 0
  );
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [existingUrl, setExistingUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [caption, setCaption] = useState(
    editing && !editingText ? editing.body || "" : ""
  );
  const [audienceMode, setAudienceMode] = useState(
    editing?.audienceMode || "connection_contacts"
  );
  const [contactListId, setContactListId] = useState(
    editing?.audienceMode === "contact_list" && editing.contactListId
      ? String(editing.contactListId)
      : ""
  );
  const [contactLists, setContactLists] = useState([]);
  const [audience, setAudience] = useState({ status: "idle" });
  const [when, setWhen] = useState("now");
  const [scheduleValue, setScheduleValue] = useState("");
  const [savedPost, setSavedPost] = useState(editing || null);
  const [dirty, setDirty] = useState(!editing);
  const [mediaDirty, setMediaDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/whatsapp-status/connections")
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setConnections(list);
        const picked = pickDefaultConnection(list, defaultWhatsappId);
        setWhatsappId(picked);
        // The draft's connection is gone: saving must send the new one.
        if (editing && picked !== editing.whatsappId) setDirty(true);
      })
      .catch(err => active && setError(errorText(err)))
      .finally(() => active && setConnectionsLoaded(true));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWhatsappId]);

  const editingId = editing?.id;
  const editingMedia = Boolean(editing?.hasMedia) && editing?.kind !== "text";

  // The file already stored with the draft, for the preview.
  useEffect(() => {
    if (!editingMedia) return undefined;
    let active = true;
    let objectUrl = null;
    api
      .get(`/whatsapp-status/posts/${editingId}/media`, {
        responseType: "blob"
      })
      .then(({ data }) => {
        if (!active || typeof URL.createObjectURL !== "function") return;
        objectUrl = URL.createObjectURL(data);
        setExistingUrl(objectUrl);
      })
      .catch(() => {
        // The preview is optional; the draft keeps its file either way.
      });
    return () => {
      active = false;
      if (objectUrl && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(objectUrl);
    };
  }, [editingId, editingMedia]);

  useEffect(() => {
    if (audienceMode !== "contact_list" || contactLists.length)
      return undefined;
    let active = true;
    const loadLists = async () => {
      const records = [];
      for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
        const { data } = await api.get("/contact-lists", {
          params: { pageNumber: page }
        });
        records.push(...(data?.records || []));
        if (!data?.hasMore) break;
      }
      if (active) setContactLists(records);
    };
    loadLists().catch(err => active && setError(errorText(err)));
    return () => {
      active = false;
    };
  }, [audienceMode, contactLists.length]);

  useEffect(() => {
    if (!whatsappId) {
      setAudience({ status: "idle" });
      return undefined;
    }
    if (audienceMode === "contact_list" && !contactListId) {
      setAudience({ status: "idle" });
      return undefined;
    }
    let active = true;
    setAudience({ status: "loading" });
    const params = { whatsappId, audienceMode };
    if (audienceMode === "contact_list")
      params.contactListId = Number(contactListId);
    api
      .get("/whatsapp-status/audience-preview", { params })
      .then(({ data }) => {
        if (!active) return;
        setAudience({
          status: "ok",
          count: Number(data?.count) || 0,
          sample: Array.isArray(data?.sample) ? data.sample : []
        });
      })
      .catch(err => {
        if (active)
          setAudience({
            status: "error",
            message: errorText(err),
            code: err?.response?.data?.error
          });
      });
    return () => {
      active = false;
    };
  }, [whatsappId, audienceMode, contactListId]);

  useEffect(
    () => () => {
      if (fileUrl && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(fileUrl);
    },
    [fileUrl]
  );

  const connection = connections.find(item => item.id === whatsappId) || null;
  const capabilities = connection?.capabilities || {};
  const isText = kind === "text";
  const background = isText ? STORY_COLORS[colorIndex].hex : MEDIA_BACKGROUND;
  const scheduling = when === "schedule";
  const capabilityReason = blockReason(connection, kind);
  // A disconnected session can still take a scheduled story: the worker
  // checks the connection again when the time comes.
  const reason =
    capabilityReason === "DISCONNECTED" && scheduling ? null : capabilityReason;
  const minSchedule = useMemo(() => toLocalInput(new Date()), []);

  // Media already stored with the post counts while the kind still matches.
  const existingMedia =
    !file &&
    !mediaDirty &&
    Boolean(savedPost?.hasMedia) &&
    savedPost?.kind === kind;
  const hasMedia = Boolean(file) || existingMedia;
  const previewUrl = fileUrl || (existingMedia ? existingUrl : null);
  const contentOk = isText
    ? text.trim().length > 0 && text.length <= TEXT_LIMIT
    : hasMedia;
  const audienceOk = audience.status === "ok" && audience.count > 0;
  const scheduleOk =
    !scheduling ||
    (Boolean(scheduleValue) && new Date(scheduleValue).getTime() > Date.now());
  const canPublish =
    Boolean(connection) &&
    !reason &&
    contentOk &&
    audienceOk &&
    scheduleOk &&
    !submitting;
  const canSaveDraft =
    Boolean(connection) &&
    contentOk &&
    (audienceMode !== "contact_list" || Boolean(contactListId)) &&
    !submitting;
  const canDownload =
    Boolean(connection) &&
    capabilities.manualExport &&
    !isText &&
    hasMedia &&
    !submitting;

  const touch = () => {
    setDirty(true);
    setError("");
  };

  const chooseKind = next => {
    if (next === kind) return;
    setKind(next);
    if (file && (next === "text" || !fileMatchesKind(file, next))) {
      setFile(null);
      setFileUrl(null);
    }
    touch();
  };

  const chooseFile = selected => {
    if (!selected) return;
    if (!fileMatchesKind(selected, kind)) {
      setError(failureMessage("ERR_STATUS_MEDIA_INVALID"));
      return;
    }
    setFile(selected);
    setFileUrl(
      typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(selected)
        : null
    );
    setMediaDirty(true);
    touch();
  };

  const buildForm = includeMedia => {
    const form = new FormData();
    form.append("whatsappId", String(whatsappId));
    form.append("kind", kind);
    form.append("body", isText ? text : caption);
    if (isText) form.append("backgroundColor", STORY_COLORS[colorIndex].hex);
    form.append("audienceMode", audienceMode);
    if (audienceMode === "contact_list")
      form.append("contactListId", String(contactListId));
    if (includeMedia && file && !isText) form.append("media", file);
    return form;
  };

  // Creates the draft once (same Idempotency-Key on every retry of this
  // form) and updates it afterwards, so a retry never makes a second post.
  const saveDraft = async () => {
    if (savedPost && !dirty) return savedPost;
    let post;
    if (!savedPost) {
      ({ data: post } = await api.post(
        "/whatsapp-status/posts",
        buildForm(true),
        { headers: { "Idempotency-Key": idempotencyKey.current } }
      ));
    } else {
      ({ data: post } = await api.put(
        `/whatsapp-status/posts/${savedPost.id}`,
        buildForm(mediaDirty)
      ));
    }
    setSavedPost(post);
    setDirty(false);
    setMediaDirty(false);
    return post;
  };

  const run = async task => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = () =>
    run(async () => {
      const draft = await saveDraft();
      const body = scheduling
        ? { scheduledAt: new Date(scheduleValue).toISOString() }
        : {};
      const { data: post } = await api.post(
        `/whatsapp-status/posts/${draft.id}/publish`,
        body
      );
      setSavedPost(post);
      if (post?.state === "unsupported" || post?.state === "failed") {
        setError(failureMessage(post.failureCode || "ERR_STATUS_UNSUPPORTED"));
        // The next attempt sends the form again, which returns it to draft.
        setDirty(true);
        return;
      }
      onSaved({
        post,
        action: scheduling ? "schedule" : "publish",
        connection
      });
    });

  const handleSaveDraft = () =>
    run(async () => {
      const post = await saveDraft();
      onSaved({ post, action: "draft", connection });
    });

  const handleDownload = () =>
    run(async () => {
      const wasSaved = savedPost && !dirty;
      const post = await saveDraft();
      if (!wasSaved) onSaved({ post, action: "draft", connection });
      await downloadStoryMedia(post);
    });

  const audienceLine = () => {
    if (audience.status === "loading")
      return (
        <span className="ews-hint">
          {t("whatsappStatus.modal.audienceLoading")}
        </span>
      );
    if (audience.status === "error")
      return (
        <span className="ews-hint ews-hint--error" role="alert">
          {audience.message}
        </span>
      );
    if (audience.status !== "ok") return null;
    if (audience.count === 0)
      return (
        <span className="ews-hint ews-hint--error" role="alert">
          {failureMessage("ERR_STATUS_AUDIENCE_EMPTY")}
        </span>
      );
    const base =
      audience.count === 1
        ? t("whatsappStatus.modal.audienceCountOne")
        : t("whatsappStatus.modal.audienceCount", { n: audience.count });
    const names = audience.sample.length
      ? ` (${audience.sample.join(", ")}${audience.count > audience.sample.length ? ", …" : ""})`
      : "";
    return <span className="ews-hint">{`${base}${names}`}</span>;
  };

  const connectionLabel = item => {
    const phone = formatPhone(item.number);
    return phone ? `${item.name} · ${phone}` : item.name;
  };

  return (
    <Layer className="ews-compose" onClose={onClose}>
      <div
        className="ews-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ews-new-story-title"
      >
        <header className="ews-dialog-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="ews-new-story-title">
              {t(
                editing
                  ? "whatsappStatus.modal.editTitle"
                  : "whatsappStatus.modal.title"
              )}
            </h2>
            <p>{t("whatsappStatus.modal.subtitle")}</p>
          </div>
          <button
            type="button"
            className="ews-icon-btn"
            aria-label={t("whatsappStatus.modal.close")}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="ews-dialog-body">
          <div className="ews-form">
            <label className="ews-field">
              <span className="ews-label">
                {t("whatsappStatus.modal.connection")}
              </span>
              <span className="ews-select-wrap">
                <select
                  aria-label={t("whatsappStatus.modal.connection")}
                  value={whatsappId ?? ""}
                  disabled={!connections.length}
                  onChange={event => {
                    setWhatsappId(Number(event.target.value) || null);
                    touch();
                  }}
                >
                  {connections.map(item => (
                    <option key={item.id} value={item.id}>
                      {connectionLabel(item)}
                    </option>
                  ))}
                </select>
              </span>
              {connectionsLoaded && !connections.length && (
                <span className="ews-hint ews-hint--error">
                  {t("whatsappStatus.modal.noConnections")}
                </span>
              )}
            </label>

            {capabilityReason && (
              <div className="ews-note" role="note">
                <InfoIcon />
                <span>
                  {t(`whatsappStatus.modal.reasons.${capabilityReason}`)}
                </span>
              </div>
            )}

            <div className="ews-field">
              <span className="ews-label">
                {t("whatsappStatus.modal.type")}
              </span>
              <div
                role="tablist"
                aria-label={t("whatsappStatus.modal.typeAria")}
                className="ews-segments"
              >
                {KINDS.map(item => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={kind === item ? "true" : "false"}
                    className="ews-segment"
                    onClick={() => chooseKind(item)}
                  >
                    {t(`whatsappStatus.modal.kinds.${item}`)}
                  </button>
                ))}
              </div>
            </div>

            {isText ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <label className="ews-field">
                  <span className="ews-label">
                    {t("whatsappStatus.modal.text")}
                  </span>
                  <textarea
                    rows={4}
                    className="ews-textarea"
                    aria-label={t("whatsappStatus.modal.text")}
                    maxLength={TEXT_LIMIT}
                    value={text}
                    onChange={event => {
                      setText(event.target.value);
                      touch();
                    }}
                  />
                  <span
                    className={`ews-hint${text.length > TEXT_LIMIT ? " ews-hint--error" : ""}`}
                  >
                    {t("whatsappStatus.modal.textCount", { n: text.length })}
                  </span>
                </label>
                <div className="ews-field">
                  <span className="ews-label">
                    {t("whatsappStatus.modal.background")}
                  </span>
                  <div className="ews-colors">
                    {STORY_COLORS.map((color, index) => (
                      <button
                        key={color.key}
                        type="button"
                        className="ews-color"
                        aria-label={t(
                          `whatsappStatus.modal.colors.${color.key}`
                        )}
                        aria-pressed={colorIndex === index ? "true" : "false"}
                        style={{ background: color.hex }}
                        onClick={() => {
                          setColorIndex(index);
                          touch();
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div
                  className={`ews-drop${dragOver ? " ews-drop--over" : ""}`}
                  onDragOver={event => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={event => {
                    event.preventDefault();
                    setDragOver(false);
                    chooseFile(event.dataTransfer?.files?.[0]);
                  }}
                >
                  <ImageIcon style={{ color: "var(--ew-muted, #63636B)" }} />
                  <div className="ews-drop-title">
                    {t(
                      kind === "video"
                        ? "whatsappStatus.modal.dropVideo"
                        : "whatsappStatus.modal.dropImage"
                    )}
                  </div>
                  <div className="ews-drop-hint">
                    {file
                      ? file.name
                      : existingMedia
                        ? t("whatsappStatus.modal.mediaAttached")
                        : t(
                            kind === "video"
                              ? "whatsappStatus.modal.hintVideo"
                              : "whatsappStatus.modal.hintImage"
                          )}
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT[kind]}
                    className="ews-sr-only"
                    tabIndex={-1}
                    aria-label={t("whatsappStatus.modal.selectFile")}
                    onChange={event => {
                      chooseFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="ews-btn-ghost"
                    onClick={() => fileInput.current?.click()}
                  >
                    {t("whatsappStatus.modal.selectFile")}
                  </button>
                </div>
                <label className="ews-field">
                  <span className="ews-label">
                    {t("whatsappStatus.modal.caption")}{" "}
                    <span className="ews-label-optional">
                      {t("whatsappStatus.modal.optional")}
                    </span>
                  </span>
                  <input
                    type="text"
                    className="ews-input"
                    placeholder={t("whatsappStatus.modal.captionPlaceholder")}
                    maxLength={TEXT_LIMIT}
                    value={caption}
                    onChange={event => {
                      setCaption(event.target.value);
                      touch();
                    }}
                  />
                </label>
              </div>
            )}

            <div className="ews-field">
              <label className="ews-field">
                <span className="ews-label">
                  {t("whatsappStatus.modal.audience")}
                </span>
                <span className="ews-select-wrap">
                  <select
                    aria-label={t("whatsappStatus.modal.audience")}
                    value={audienceMode}
                    onChange={event => {
                      setAudienceMode(event.target.value);
                      touch();
                    }}
                  >
                    <option value="connection_contacts">
                      {t("whatsappStatus.modal.audienceAll")}
                    </option>
                    <option value="contact_list">
                      {t("whatsappStatus.modal.audienceList")}
                    </option>
                  </select>
                </span>
              </label>
              {audienceMode === "contact_list" && (
                <span className="ews-select-wrap">
                  <select
                    aria-label={t("whatsappStatus.modal.contactList")}
                    value={contactListId}
                    onChange={event => {
                      setContactListId(event.target.value);
                      touch();
                    }}
                  >
                    <option value="">
                      {t("whatsappStatus.modal.contactListPlaceholder")}
                    </option>
                    {contactLists.map(list => (
                      <option key={list.id} value={String(list.id)}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </span>
              )}
              {audienceLine()}
              {audienceMode === "contact_list" &&
                contactListId &&
                ((audience.status === "ok" && audience.count === 0) ||
                  (audience.status === "error" &&
                    audience.code === "ERR_STATUS_AUDIENCE_EMPTY")) && (
                  <a
                    className="ews-hint"
                    href={`/contact-lists/${contactListId}/contacts`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("whatsappStatus.modal.manageContactList")}
                  </a>
                )}
            </div>

            <div className="ews-field">
              <span className="ews-label">
                {t("whatsappStatus.modal.when")}
              </span>
              <div
                role="radiogroup"
                aria-label={t("whatsappStatus.modal.whenAria")}
                className="ews-segments"
              >
                {["now", "schedule"].map(option => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={when === option ? "true" : "false"}
                    className="ews-segment"
                    onClick={() => setWhen(option)}
                  >
                    {t(`whatsappStatus.modal.${option}`)}
                  </button>
                ))}
              </div>
              {scheduling && (
                <span className="ews-select-wrap">
                  <input
                    type="datetime-local"
                    aria-label={t("whatsappStatus.modal.scheduleAt")}
                    min={minSchedule}
                    value={scheduleValue}
                    onChange={event => setScheduleValue(event.target.value)}
                  />
                </span>
              )}
            </div>
          </div>

          <div className="ews-preview-col">
            <span className="ews-label">
              {t("whatsappStatus.modal.preview")}
            </span>
            <div className="ews-phone" style={{ background }}>
              <div className="ews-phone-bar">
                <span />
              </div>
              <div className="ews-phone-head">
                <span
                  className="ews-avatar"
                  style={{ width: 24, height: 24, fontSize: 9.5 }}
                >
                  {initialsOf(connection?.name)}
                </span>
                <span className="ews-phone-name">{connection?.name || ""}</span>
                <span className="ews-phone-time">
                  {t("whatsappStatus.modal.previewNow")}
                </span>
              </div>
              {isText ? (
                <div className="ews-phone-text">{text}</div>
              ) : (
                <div className="ews-phone-media">
                  {previewUrl && kind === "video" && (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={previewUrl} muted playsInline controls />
                  )}
                  {previewUrl && kind === "image" && (
                    <img src={previewUrl} alt="" />
                  )}
                  {!previewUrl && (
                    <>
                      <ImageIcon size={26} />
                      {t(
                        kind === "video"
                          ? "whatsappStatus.modal.previewVideo"
                          : "whatsappStatus.modal.previewImage"
                      )}
                    </>
                  )}
                  {previewUrl && caption && (
                    <div className="ews-phone-caption">{caption}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="ews-dialog-foot">
          <span className="ews-privacy">
            <InfoIcon size={14} />
            {t("whatsappStatus.modal.privacy")}
          </span>
          <button type="button" className="ews-btn-ghost" onClick={onClose}>
            {t("whatsappStatus.modal.cancel")}
          </button>
          {reason && (
            <button
              type="button"
              className="ews-btn-ghost"
              disabled={!canSaveDraft}
              onClick={handleSaveDraft}
            >
              {t("whatsappStatus.modal.saveDraft")}
            </button>
          )}
          {reason && capabilities.manualExport && !isText && (
            <button
              type="button"
              className="ews-btn-ghost"
              disabled={!canDownload}
              onClick={handleDownload}
            >
              <DownloadIcon />
              {t("whatsappStatus.modal.download")}
            </button>
          )}
          <button
            type="button"
            className="ews-btn-primary"
            disabled={!canPublish}
            title={
              reason ? t(`whatsappStatus.modal.reasons.${reason}`) : undefined
            }
            onClick={handlePublish}
          >
            {scheduling ? <CalendarIcon /> : <SendIcon />}
            {t(
              scheduling
                ? "whatsappStatus.modal.scheduleSubmit"
                : "whatsappStatus.modal.publish"
            )}
          </button>
          {error && (
            <span className="ews-error" role="alert">
              {error}
            </span>
          )}
        </footer>
      </div>
    </Layer>
  );
};

export default NewStoryModal;
