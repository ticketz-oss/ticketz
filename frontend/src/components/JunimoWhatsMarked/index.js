import React, { useMemo } from "react";
import { useTheme } from "@material-ui/core/styles";
import WhatsMarked from "react-whatsmarked";
import JunimoText from "../JunimoText";

const supportedTags = new Set([
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "s",
  "del",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "div",
  "tt",
  "hr"
]);
const hiddenTags = new Set(["script", "style", "iframe", "object", "embed"]);
const safeHref = href => /^(https?:|mailto:|tel:|ftp:|\/|#)/i.test(href || "");

function annotateNode(node, key) {
  if (node.nodeType === 3) {
    // Formatter whitespace between blocks must stay collapsed as before.
    if (/^\s*$/.test(node.textContent)) return node.textContent;
    return <JunimoText key={key} text={node.textContent} />;
  }
  if (node.nodeType !== 1 || hiddenTags.has(node.localName)) return null;
  const children = Array.from(node.childNodes, (child, index) =>
    annotateNode(child, `${key}-${index}`)
  );
  if (!supportedTags.has(node.localName))
    return <React.Fragment key={key}>{children}</React.Fragment>;
  const props = { key };
  if (node.className) props.className = node.className;
  for (const name of ["title", "dir"])
    if (node.hasAttribute(name)) props[name] = node.getAttribute(name);
  if (
    node.localName === "ol" &&
    /^-?\d+$/.test(node.getAttribute("start") || "")
  )
    props.start = Number(node.getAttribute("start"));
  if (
    node.localName === "li" &&
    /^-?\d+$/.test(node.getAttribute("value") || "")
  )
    props.value = Number(node.getAttribute("value"));
  if (node.localName === "a" && safeHref(node.getAttribute("href"))) {
    props.href = node.getAttribute("href");
    if (node.getAttribute("target") === "_blank") {
      props.target = "_blank";
      props.rel = "noopener noreferrer";
    }
  }
  return React.createElement(
    node.localName,
    props,
    ["br", "hr"].includes(node.localName) ? undefined : children
  );
}

export default function JunimoWhatsMarked({ children, oneline, className }) {
  const theme = useTheme();
  const annotated = useMemo(() => {
    if (!theme.isStardew || !children || typeof DOMParser === "undefined")
      return null;
    // v0.9.19's formatter is a pure function with no renderer extension.
    // Parse its existing output offscreen, preserving its formatting and links;
    // visible DOM and the original message string are never modified.
    const formatted = WhatsMarked({ children, oneline, className });
    const html = formatted?.props?.dangerouslySetInnerHTML?.__html;
    if (typeof html !== "string") return null;
    const parsed = new DOMParser().parseFromString(html, "text/html");
    return (
      <div className={formatted.props.className}>
        {Array.from(parsed.body.childNodes, (node, index) =>
          annotateNode(node, index)
        )}
      </div>
    );
  }, [theme.isStardew, children, oneline, className]);
  return (
    annotated || (
      <WhatsMarked oneline={oneline} className={className}>
        {children}
      </WhatsMarked>
    )
  );
}
