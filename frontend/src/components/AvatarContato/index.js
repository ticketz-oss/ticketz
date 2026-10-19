import React, { useEffect, useRef, useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import api from "../../services/api";
import { avatarIlustrado } from "../../helpers/avatarIlustrado";
import AvatarPreview from "../AvatarPreview";
import OneWorksMotion from "../OneWorksMotion";

function Foto({
  contact,
  children,
  alt,
  preview,
  className,
  style,
  onClick,
  ...props
}) {
  const [pictures, setPictures] = useState(contact);
  const [failed, setFailed] = useState([]);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const attempted = useRef(false);
  const src = [pictures.profilePicUrl, pictures.profileHiresPictureUrl].find(
    url => url && !failed.includes(url)
  );
  const fallback = !contact.isGroup && avatarIlustrado("contato", contact.id);
  const showingIllustration = !src && fallback && !fallbackFailed;
  const displayedSrc = src || (showingIllustration ? fallback : undefined);

  const openPreview = event => {
    if (onClick) onClick(event);
    if (!preview || !displayedSrc) return;
    event.stopPropagation();
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (
      src ||
      !contact.id ||
      attempted.current ||
      (contact.channel && contact.channel !== "whatsapp")
    )
      return;
    attempted.current = true;
    let active = true;
    Promise.resolve()
      .then(() => api.post(`/contacts/${contact.id}/picture/refresh`))
      .then(({ data }) => {
        if (active) setPictures(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [src, contact.id, contact.channel]);

  return (
    <>
      <Avatar
        {...props}
        className={[className, showingIllustration && "one-works-avatar"]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...style,
          ...(preview && displayedSrc ? { cursor: "pointer" } : {})
        }}
        onClick={openPreview}
        onKeyDown={event => {
          if (
            preview &&
            displayedSrc &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            openPreview(event);
          }
        }}
        role={preview && displayedSrc ? "button" : undefined}
        tabIndex={preview && displayedSrc ? 0 : undefined}
        aria-label={preview && displayedSrc ? alt || contact.name : undefined}
      >
        {src ? (
          <img
            src={src}
            alt={alt || contact.name || ""}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setFailed(previous => [...previous, src])}
          />
        ) : showingIllustration ? (
          <OneWorksMotion
            src={fallback}
            alt={alt || contact.name || ""}
            onError={() => setFallbackFailed(true)}
          />
        ) : (
          children
        )}
      </Avatar>
      {preview && displayedSrc && (
        <AvatarPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={displayedSrc}
          alt={alt || contact.name}
          illustrated={showingIllustration}
        />
      )}
    </>
  );
}

export default function AvatarContato({ contact = {}, ...props }) {
  // Remount on tenant/contact/URL changes; an old request cannot repaint another contact.
  const key = `${contact.companyId}:${contact.id}:${contact.profilePicUrl}:${contact.profileHiresPictureUrl}`;
  return <Foto key={key} contact={contact} {...props} />;
}
