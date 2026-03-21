import React, { useEffect, useState } from "react";
import Lightbox, { IconButton as YarlIconButton } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/styles.css";

const RotateLeftIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <polyline points="3 4 3 10 9 10" />
  </svg>
);

const RotateRightIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <polyline points="21 4 21 10 15 10" />
  </svg>
);

const normalizeRotation = (value) => ((value % 360) + 360) % 360;

const buildCacheBustedUrl = (url, seed) => {
  if (!url) {
    return url;
  }

  const cacheBuster = seed || Date.now();
  try {
    const parsedUrl = new URL(url, window.location.origin);
    parsedUrl.searchParams.set("cb", `${cacheBuster}`);
    return parsedUrl.toString();
  } catch (error) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}cb=${cacheBuster}`;
  }
};

const extractFileName = (url, fallback) => {
  if (!url) {
    return fallback;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || fallback);
  } catch (error) {
    const parts = url.split("?")[0].split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || fallback);
  }
};

const VIDEO_THUMBNAIL_FALLBACK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#0f172a"/><circle cx="160" cy="90" r="42" fill="#ffffff" fill-opacity="0.92"/><polygon points="148,68 148,112 186,90" fill="#0f172a"/></svg>'
)}`;

export const buildMediaGalleryData = (
  messages,
  {
    getId = (message) => message?.id,
    getMediaType = (message) => message?.mediaType,
    getMediaUrl = (message) => message?.mediaUrl,
    getThumbnailUrl = (message) => message?.thumbnailUrl,
    getDescription = (message) => message?.body,
    getUpdatedAt = (message) => message?.updatedAt,
    getCreatedAt = (message) => message?.createdAt,
    getDataJson = (message) => message?.dataJson,
  } = {}
) => {
  return messages.reduce(
    (acc, message) => {
      const messageId = getId(message);
      const mediaType = getMediaType(message);
      const mediaUrl = getMediaUrl(message);

      if (!mediaUrl || !["image", "video"].includes(mediaType)) {
        return acc;
      }

      let data = null;
      try {
        const rawData = getDataJson(message);
        data = rawData ? JSON.parse(rawData) : null;
      } catch (error) {
        data = null;
      }

      const isSticker = !!(data?.message && ("stickerMessage" in data.message));
      if (isSticker) {
        return acc;
      }

      const thumbnailUrl = getThumbnailUrl(message);
      const description = getDescription(message) || undefined;
      const cacheSeed = getUpdatedAt(message) || getCreatedAt(message) || messageId;
      const downloadUrl = buildCacheBustedUrl(mediaUrl, cacheSeed);

      acc.byMessageId[messageId] = acc.slides.length;

      if (mediaType === "video") {
        acc.slides.push({
          key: `${messageId}`,
          type: "video",
          width: 1280,
          height: 720,
          autoPlay: true,
          controls: true,
          description,
          thumbnail: thumbnailUrl || VIDEO_THUMBNAIL_FALLBACK,
          poster: thumbnailUrl || mediaUrl,
          download: {
            url: downloadUrl,
            filename: extractFileName(mediaUrl, `video-${messageId}`),
          },
          sources: [{ src: mediaUrl }],
        });
      } else {
        acc.slides.push({
          key: `${messageId}`,
          src: mediaUrl,
          thumbnail: thumbnailUrl || mediaUrl,
          description,
          download: {
            url: downloadUrl,
            filename: extractFileName(mediaUrl, `image-${messageId}`),
          },
        });
      }

      return acc;
    },
    { slides: [], byMessageId: {} }
  );
};

const MediaGalleryLightbox = ({
  open,
  index,
  slides,
  onClose,
  onViewIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(index || 0);
  const [rotationBySlide, setRotationBySlide] = useState({});

  useEffect(() => {
    setCurrentIndex(index || 0);
  }, [index]);

  useEffect(() => {
    if (!open) {
      setRotationBySlide({});
    }
  }, [open]);

  const rotateCurrentSlide = (degrees) => {
    const currentSlide = slides[currentIndex];
    const slideKey = currentSlide?.key;
    if (!slideKey) {
      return;
    }

    setRotationBySlide((previous) => ({
      ...previous,
      [slideKey]: normalizeRotation((previous[slideKey] || 0) + degrees),
    }));
  };

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      on={{
        view: ({ index: viewedIndex }) => {
          setCurrentIndex(viewedIndex);
          if (onViewIndexChange) {
            onViewIndexChange(viewedIndex);
          }
        },
      }}
      render={{
        slideContainer: ({ slide, children }) => {
          const rotation = rotationBySlide[slide?.key] || 0;
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {children}
            </div>
          );
        },
      }}
      captions={{
        descriptionTextAlign: "start",
        descriptionMaxLines: 4,
      }}
      thumbnails={{
        position: "bottom",
        width: 120,
        height: 88,
        border: 1,
        borderRadius: 8,
        padding: 2,
        gap: 10,
        vignette: false,
      }}
      toolbar={{
        buttons: [
          "zoom",
          "download",
          <YarlIconButton
            key="rotate-left"
            label="Rotate left"
            icon={RotateLeftIcon}
            onClick={() => rotateCurrentSlide(-90)}
            disabled={!slides.length}
          />,
          <YarlIconButton
            key="rotate-right"
            label="Rotate right"
            icon={RotateRightIcon}
            onClick={() => rotateCurrentSlide(90)}
            disabled={!slides.length}
          />,
          "close",
        ],
      }}
      plugins={[Video, Zoom, Download, Thumbnails, Captions]}
    />
  );
};

export default MediaGalleryLightbox;
