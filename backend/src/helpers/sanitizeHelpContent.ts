import sanitizeHtml from "sanitize-html";

/**
 * Limpa o HTML produzido pelo editor Quill antes de gravar.
 *
 * A allowlist cobre exatamente o que o toolbar do RichTextEditor gera. O
 * artigo e renderizado com dangerouslySetInnerHTML no cliente e no portal do
 * parceiro, entao sanitizar na escrita e o que impede um super admin (ou um
 * paste de fora) de injetar script na tela de todo mundo.
 */
const sanitizeHelpContent = (content?: string): string => {
  if (!content) {
    return "";
  }

  return sanitizeHtml(content, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "br",
      "hr",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ol",
      "ul",
      "li",
      "a",
      "img",
      "pre",
      "code",
      "span",
      "div"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      // Quill marca indentacao e alinhamento por classe (ql-indent-1,
      // ql-align-center) no proprio elemento.
      "*": ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    transformTags: {
      // Link de artigo sempre abre fora sem dar window.opener para o destino.
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer"
      })
    }
  });
};

export default sanitizeHelpContent;
