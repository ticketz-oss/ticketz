import React, { useState } from "react";
import { Dialog, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { i18n } from "../../translate/i18n";
import OneWorksMotion from "../OneWorksMotion";
import "./styles.css";

export default function AvatarPreview({
  open,
  onClose,
  src,
  alt,
  illustrated
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label={alt || i18n.t("fluxos.fechar")}
      PaperProps={{ className: "avatar-preview-dialog" }}
    >
      <IconButton
        className="avatar-preview-close"
        aria-label={i18n.t("fluxos.fechar")}
        onClick={onClose}
      >
        <CloseIcon />
      </IconButton>
      {illustrated ? (
        <div
          className="avatar-preview-image avatar-preview-flip-card"
          tabIndex={0}
          role="group"
          aria-label={alt || ""}
          onMouseEnter={() => setFlipped(true)}
          onMouseLeave={() => setFlipped(false)}
          onFocus={() => setFlipped(true)}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setFlipped(false);
          }}
          onTouchStart={() => setFlipped(true)}
        >
          <div
            className={`avatar-preview-flip-rotor${flipped ? " is-flipped" : ""}`}
          >
            <div className="avatar-preview-flip-face" aria-hidden={flipped}>
              <img src={src} alt="" />
            </div>
            <div
              className="avatar-preview-flip-face avatar-preview-flip-back"
              aria-hidden={!flipped}
            >
              <OneWorksMotion src={src} alt="" active interactive />
            </div>
          </div>
        </div>
      ) : (
        <img className="avatar-preview-image" src={src} alt={alt || ""} />
      )}
    </Dialog>
  );
}
