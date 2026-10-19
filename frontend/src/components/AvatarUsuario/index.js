import React, { useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import { corAvatar } from "../../helpers/coresAvatar";
import { getInitials } from "../../helpers/getInitials";
import { urlFotoUsuario } from "../../helpers/urlFotoUsuario";
import { avatarIlustrado } from "../../helpers/avatarIlustrado";
import AvatarPreview from "../AvatarPreview";
import OneWorksMotion from "../OneWorksMotion";

function FotoUsuario({
  usuario,
  tamanho,
  style,
  preview,
  className,
  onClick,
  ...props
}) {
  const [fotoFalhou, setFotoFalhou] = useState(false);
  const [ilustracaoFalhou, setIlustracaoFalhou] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const foto = urlFotoUsuario(usuario?.profilePicUrl);
  const ilustracao = avatarIlustrado("usuario", usuario?.id);
  const src = (!fotoFalhou && foto) || (!ilustracaoFalhou && ilustracao);
  const showingIllustration = !!src && src === ilustracao;

  const openPreview = event => {
    if (onClick) onClick(event);
    if (!preview || !src) return;
    event.stopPropagation();
    setPreviewOpen(true);
  };

  return (
    <>
      <Avatar
        {...props}
        className={[className, showingIllustration && "one-works-avatar"]
          .filter(Boolean)
          .join(" ")}
        role={preview && src ? "button" : undefined}
        tabIndex={preview && src ? 0 : undefined}
        aria-label={preview && src ? usuario?.name : undefined}
        onClick={openPreview}
        onKeyDown={event => {
          if (preview && src && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openPreview(event);
          }
        }}
        style={{
          width: tamanho,
          height: tamanho,
          flexShrink: 0,
          fontSize: tamanho / 3,
          backgroundColor: corAvatar(
            String(usuario?.id || usuario?.name || "")
          ),
          color: "white",
          ...(preview && src ? { cursor: "pointer" } : {}),
          ...style
        }}
      >
        {showingIllustration ? (
          <OneWorksMotion
            src={src}
            alt={usuario?.name || ""}
            onError={() => setIlustracaoFalhou(true)}
          />
        ) : src ? (
          <img
            src={src}
            alt={usuario?.name || ""}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => {
              if (src === foto) setFotoFalhou(true);
              else setIlustracaoFalhou(true);
            }}
          />
        ) : (
          getInitials(usuario?.name || "")
        )}
      </Avatar>
      {preview && src && (
        <AvatarPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={src}
          alt={usuario?.name}
          illustrated={showingIllustration}
        />
      )}
    </>
  );
}

export default function AvatarUsuario({
  usuario,
  tamanho = 36,
  style,
  preview = false,
  ...props
}) {
  const key = `${usuario?.id}:${usuario?.profilePicUrl}`;
  return (
    <FotoUsuario
      key={key}
      usuario={usuario}
      tamanho={tamanho}
      style={style}
      preview={preview}
      {...props}
    />
  );
}
