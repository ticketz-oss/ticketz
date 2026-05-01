import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  Close,
  GetApp,
  NavigateBefore,
  NavigateNext,
} from "@material-ui/icons";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const useStyles = makeStyles((theme) => ({
  // ── Thumbnail ──────────────────────────────────────────────────────────
  thumbnail: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    "&:hover $thumbnailOverlay": {
      opacity: 1,
    },
  },
  thumbnailCanvas: {
    display: "block",
    width: "100%",
  },
  thumbnailOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.18)",
    opacity: 0,
    transition: "opacity 0.2s",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    pointerEvents: "none",
  },
  thumbnailFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30px",
    background: "linear-gradient(transparent, rgba(0,0,0,0.12))",
    pointerEvents: "none",
  },
  thumbnailMessage: {
    padding: "6px 8px",
    fontSize: "0.75rem",
    color: "#666",
  },
  // ── Full-screen dialog ─────────────────────────────────────────────────
  dialogTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
  },
  dialogTitleButtons: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  dialogContent: {
    padding: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#525659",
    minHeight: "60vh",
    overflowY: "auto",
  },
  pageCanvas: {
    display: "block",
    maxWidth: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    margin: "16px auto",
    backgroundColor: "#fff",
  },
  pageNav: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
    color: "#fff",
  },
  spinnerWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    width: "100%",
    color: "#fff",
  },
}));

// ── Shared PDF loader ─────────────────────────────────────────────────────────
async function renderPageToCanvas(pdf, pageNum, canvas) {
  const page = await pdf.getPage(pageNum);
  const containerWidth = canvas.parentElement?.clientWidth || 700;
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(containerWidth / viewport.width, 2);
  const scaledViewport = page.getViewport({ scale });
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  await page.render({
    canvasContext: canvas.getContext("2d"),
    viewport: scaledViewport,
  }).promise;
}

function cacheBustUrl(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

// ── Thumbnail sub-component ───────────────────────────────────────────────────
const Thumbnail = ({ url, onOpen }) => {
  const classes = useStyles();
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    (async () => {
      try {
        const pdf = await getDocument({ url }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        const canvas = canvasRef.current;
        if (!canvas) {
          pdf.destroy();
          return;
        }

        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const page = await pdf.getPage(1);
        if (cancelled) {
          pdf.destroy();
          return;
        }

        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = Math.floor(scaledViewport.height / 2); // top half only
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: scaledViewport,
        }).promise;

        if (!cancelled) setStatus("done");
        pdf.destroy();
      } catch (e) {
        if (!cancelled) {
          console.error("PdfPreview thumbnail error:", e);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className={classes.thumbnail} onClick={onOpen}>
      {status === "loading" && (
        <div className={classes.thumbnailMessage}>Loading preview…</div>
      )}
      {status === "error" && (
        <div className={classes.thumbnailMessage}>PDF preview unavailable</div>
      )}
      <canvas
        ref={canvasRef}
        className={classes.thumbnailCanvas}
        style={{ display: status === "done" ? "block" : "none" }}
      />
      {status === "done" && (
        <>
          <div className={classes.thumbnailFade} />
          <div className={classes.thumbnailOverlay}>Click to open</div>
        </>
      )}
    </div>
  );
};

// ── Full-viewer dialog ────────────────────────────────────────────────────────
const PdfViewerDialog = ({ url, fileName, open, onClose }) => {
  const classes = useStyles();
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageStatus, setPageStatus] = useState("loading");

  // Load PDF when dialog opens
  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;

    // Reset state so the page-render effect always fires on re-open,
    // even when numPages/currentPage happen to be the same values as before.
    setNumPages(0);
    setCurrentPage(1);
    setPageStatus("loading");

    (async () => {
      try {
        const pdf = await getDocument({ url }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      } catch (e) {
        if (!cancelled) {
          console.error("PdfViewer load error:", e);
          setPageStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }
    };
  }, [open, url]);

  // Render the current page whenever it changes or PDF is loaded
  useEffect(() => {
    if (!pdfRef.current || !numPages) return;
    let cancelled = false;
    setPageStatus("loading");

    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        await renderPageToCanvas(pdfRef.current, currentPage, canvas);
        if (!cancelled) setPageStatus("done");
      } catch (e) {
        if (!cancelled) {
          console.error("PdfViewer render error:", e);
          setPageStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage, numPages]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = cacheBustUrl(url);
    a.download = fileName || "document.pdf";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [url, fileName]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <Typography
          variant="subtitle1"
          noWrap
          style={{ flex: 1, marginRight: 8 }}
        >
          {fileName || "PDF Document"}
        </Typography>
        <div className={classes.dialogTitleButtons}>
          {numPages > 1 && (
            <div className={classes.pageNav}>
              <Tooltip title="Previous page">
                <span>
                  <IconButton
                    size="small"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <NavigateBefore />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="body2">
                {currentPage} / {numPages}
              </Typography>
              <Tooltip title="Next page">
                <span>
                  <IconButton
                    size="small"
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <NavigateNext />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
          )}
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload}>
              <GetApp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          </Tooltip>
        </div>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {pageStatus === "loading" && (
          <div className={classes.spinnerWrap}>
            <CircularProgress color="inherit" />
          </div>
        )}
        {pageStatus === "error" && (
          <div className={classes.spinnerWrap}>
            <Typography color="inherit">Failed to render page.</Typography>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={classes.pageCanvas}
          style={{ display: pageStatus === "done" ? "block" : "none" }}
        />
      </DialogContent>
    </Dialog>
  );
};

// ── Public component ──────────────────────────────────────────────────────────
const PdfPreview = ({ url, fileName }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Thumbnail url={url} onOpen={() => setOpen(true)} />
      <PdfViewerDialog
        url={url}
        fileName={fileName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default PdfPreview;
