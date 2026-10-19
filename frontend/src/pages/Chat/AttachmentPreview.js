import React, { useEffect, useState } from "react";
import { File, X } from "lucide-react";
import { i18n } from "../../translate/i18n";

function Attachment({ file, disabled, onRemove }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return (
    <div className="chat-anexo">
      {url ? <img src={url} alt={file.name} /> : <File size={28} />}
      <div>
        <strong title={file.name}>{file.name}</strong>
        <small>{Math.max(1, Math.ceil(file.size / 1024))} KB</small>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={i18n.t("conversa.removerAnexo", { name: file.name })}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function AttachmentPreview({ files, disabled, onRemove }) {
  if (!files.length) return null;
  return (
    <section className="chat-anexos" aria-label={i18n.t("conversa.anexos")}>
      {files.map((file, index) => (
        <Attachment
          key={`${index}-${file.name}-${file.lastModified}`}
          file={file}
          disabled={disabled}
          onRemove={() => onRemove(index)}
        />
      ))}
    </section>
  );
}
