import React, { useState } from "react";
import { i18n } from "../../translate/i18n";
import "./tags.css";

export function uniqueTags(ticket) {
  const found = new Map();
  [...(ticket.tags || []), ...(ticket.contact?.tags || [])].forEach(tag => {
    if (tag?.name)
      found.set(tag.id != null ? String(tag.id) : tag.name.toLowerCase(), tag);
  });
  return Array.from(found.values());
}

export default function TagsLine({ ticket, limit = 3 }) {
  const [expanded, setExpanded] = useState(false);
  const tags = uniqueTags(ticket);
  if (!tags.length) return null;
  return (
    <div className="ticket-tags" aria-label={i18n.t("conversa.etiquetas")}>
      {(expanded ? tags : tags.slice(0, limit)).map(tag => (
        <span key={tag.id ?? tag.name} className="ticket-tag" title={tag.name}>
          <i
            style={{ backgroundColor: tag.color || "var(--ew-primary)" }}
            aria-hidden="true"
          />
          {tag.name}
        </span>
      ))}
      {tags.length > limit && (
        <button
          type="button"
          className="ticket-tag-more"
          aria-expanded={expanded}
          aria-label={i18n.t(
            expanded ? "chatExperience.lessTags" : "chatExperience.moreTags",
            { count: tags.length - limit }
          )}
          onClick={event => {
            event.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? i18n.t("chatExperience.less") : `+${tags.length - limit}`}
        </button>
      )}
    </div>
  );
}
