import React, { useMemo, useState } from "react";

import Avatar from "@material-ui/core/Avatar";

import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { i18n } from "../../translate/i18n";
import MediaGalleryLightbox from "../MediaGalleryLightbox";

const hasPreviewablePhoto = profilePicUrl => {
  return Boolean(profilePicUrl && !profilePicUrl.includes("nopicture"));
};

const buildSlides = contact => {
  if (!contact?.profilePicUrl) {
    return [];
  }

  const identifier = contact?.id || contact?.number || contact?.name || "photo";

  return [
    {
      key: `contact-${identifier}`,
      src: contact.profilePicUrl,
      thumbnail: contact.profilePicUrl,
      description: contact?.name || undefined,
      download: {
        url: contact.profilePicUrl,
        filename: `contact-${identifier}`
      }
    }
  ];
};

const ClickableContactAvatar = ({ contact, avatarProps = {} }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { style: avatarStyle, ...restAvatarProps } = avatarProps;
  const previewable = hasPreviewablePhoto(contact?.profilePicUrl);
  const slides = useMemo(() => buildSlides(contact), [contact]);
  const contactLabel =
    contact?.name || contact?.number || i18n.t("contactModal.form.profile");
  const avatarLabel = `${i18n.t("contactModal.form.profile")}: ${contactLabel}`;

  const avatar = (
    <Avatar
      {...restAvatarProps}
      style={{
        backgroundColor: generateColor(contact?.number),
        color: "white",
        fontWeight: "bold",
        ...avatarStyle
      }}
      src={contact?.profilePicUrl}
      alt={avatarLabel}
    >
      {getInitials(contact?.name)}
    </Avatar>
  );

  if (!previewable) {
    return avatar;
  }

  const handleOpen = event => {
    event.preventDefault();
    event.stopPropagation();
    setLightboxOpen(true);
  };

  const handleKeyDown = event => {
    if (event.key === "Enter" || event.key === " ") {
      handleOpen(event);
    }
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={avatarLabel}
        aria-haspopup="dialog"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        style={{
          display: "inline-flex",
          cursor: "zoom-in",
          borderRadius: "50%"
        }}
      >
        {avatar}
      </span>
      <MediaGalleryLightbox
        open={lightboxOpen}
        index={0}
        slides={slides}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default ClickableContactAvatar;
