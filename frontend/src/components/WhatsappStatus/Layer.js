import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useIdentidade } from "../interface";

// Full-screen layer for the viewer and the composer. It carries the identity
// tokens because it renders outside the ticket column, closes on Escape and
// gives focus back to whatever opened it.
const Layer = ({ className = "", onClose, onKeyDown, children, ...props }) => {
  const identidade = useIdentidade();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  const keyRef = useRef(onKeyDown);
  closeRef.current = onClose;
  keyRef.current = onKeyDown;

  useEffect(() => {
    const previous = document.activeElement;
    if (ref.current) ref.current.focus();
    const handleKey = event => {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (closeRef.current) closeRef.current();
        return;
      }
      if (keyRef.current) keyRef.current(event);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, []);

  return createPortal(
    <div
      ref={ref}
      tabIndex={-1}
      className={`ew-ui ews-layer ${className}`}
      style={identidade}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
};

export default Layer;
