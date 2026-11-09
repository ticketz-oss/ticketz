import React from "react";

interface WhatsAppFormattedTextProps {
  text: string;
}

export const WhatsAppFormattedText: React.FC<WhatsAppFormattedTextProps> = ({ text }) => {
  if (!text || typeof text !== "string") return null;

  const lines = text.split("\n");

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed select-text">
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {formatLine(line)}
        </React.Fragment>
      ))}
    </div>
  );
};

function formatLine(line: string): React.ReactNode[] {
  if (!line) return [];

  // Regex matching:
  // 1. URLs (http:// or https://)
  // 2. Bold: *text* (no whitespace immediately inside asterisks)
  // 3. Italic: _text_
  // 4. Strikethrough: ~text~
  // 5. Monospace: ```text``` or `text`
  const regex =
    /(https?:\/\/[^\s]+)|(\*(?!\s)[^*\n]+(?<!\s)\*)|(_(?!\s)[^_\n]+(?<!\s)_)|(~(?!\s)[^~\n]+(?<!\s)~)|(\x60{1,3}[^\x60\n]+\x60{1,3})/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("http://") || token.startsWith("https://")) {
      elements.push(
        <a
          key={key}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 dark:text-blue-400 underline hover:opacity-80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </a>
      );
    } else if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      elements.push(
        <strong key={key} className="font-bold">
          {token.slice(1, -1)}
        </strong>
      );
    } else if (token.startsWith("_") && token.endsWith("_") && token.length > 2) {
      elements.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("~") && token.endsWith("~") && token.length > 2) {
      elements.push(
        <del key={key} className="line-through opacity-75">
          {token.slice(1, -1)}
        </del>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const code = token.replace(/^\x60+|\x60+$/g, "");
      elements.push(
        <code
          key={key}
          className="font-mono bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded text-[11px]"
        >
          {code}
        </code>
      );
    } else {
      elements.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }

  return elements;
}

export default WhatsAppFormattedText;
