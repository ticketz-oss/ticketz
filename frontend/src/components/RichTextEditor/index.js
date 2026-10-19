import React, { useMemo } from "react";
import ReactQuill from "react-quill";
import { makeStyles } from "@material-ui/core";

import "react-quill/dist/quill.snow.css";

const useStyles = makeStyles(theme => ({
  wrapper: {
    "& .ql-container": {
      minHeight: 240,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.body1.fontSize,
      borderBottomLeftRadius: theme.shape.borderRadius,
      borderBottomRightRadius: theme.shape.borderRadius
    },
    "& .ql-toolbar": {
      borderTopLeftRadius: theme.shape.borderRadius,
      borderTopRightRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.background.default
    },
    "& .ql-editor": {
      minHeight: 240
    }
  }
}));

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image"
];

/**
 * Editor de artigos da Central de Ajuda.
 *
 * O HTML que sai daqui é sanitizado no backend (helpers/sanitizeHelpContent)
 * antes de ser gravado — a allowlist de lá cobre exatamente este toolbar.
 */
const RichTextEditor = ({ value, onChange, placeholder }) => {
  const classes = useStyles();

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "link", "image"],
        ["clean"]
      ]
    }),
    []
  );

  return (
    <div className={classes.wrapper}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
