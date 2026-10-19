import React from "react";
import "./sidebar-brand.css";

export default function SidebarBrand({ expanded, bannerSrc, iconSrc, name }) {
  return (
    <img
      className={`tenant-sidebar-brand tenant-sidebar-brand--${expanded ? "banner" : "icon"}`}
      src={
        expanded
          ? bannerSrc || "/branding/logo-light.png"
          : iconSrc || "/branding/icon.png"
      }
      alt={name || "Espaço Whats"}
    />
  );
}
