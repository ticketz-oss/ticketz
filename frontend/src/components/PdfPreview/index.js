import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  makeStyles,
  Tooltip,
  Typography
} from "@material-ui/core";
import { Close, GetApp } from "@material-ui/icons";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_UNRANGED_BYTES = 10 * 1024 * 1024; // 10 MB

// True when the browser ships a built-in PDF viewer (Chrome 94+, FF 99+, Edge 94+).
const BROWSER_HAS_PDF_VIEWER =
  typeof navigator !== "undefined" && navigator.pdfViewerEnabled === true;

const useStyles = makeStyles(() => ({
  // ── Thumbnail ──────────────────────────────────────────────────────────
  thumbnail: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    "&:hover $thumbnailOverlay": {
      opacity: 1
    }
  },
  thumbnailCanvas: {
    display: "block",
    width: "100%"
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
    pointerEvents: "none"
  },
  thumbnailFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30px",
    background: "linear-gradient(transparent, rgba(0,0,0,0.12))",
    pointerEvents: "none"
  },
  thumbnailMessage: {
    padding: "6px 8px",
    fontSize: "0.75rem",
    color: "#666"
  },
  // ── Full-screen dialog ─────────────────────────────────────────────────
  dialogTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px"
  },
  dialogTitleButtons: {
    display: "flex",
    alignItems: "center",
    gap: 4
  },
  dialogContent: {
    padding: "8px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#525659",
    minHeight: "60vh",
    overflowY: "auto"
  },
  dialogContentIframe: {
    padding: 0,
    height: "80vh",
    overflow: "hidden"
  },
  pdfIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block"
  },
  pageCanvas: {
    display: "block",
    maxWidth: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    margin: "8px auto",
    backgroundColor: "#fff"
  },
  pagePlaceholder: {
    // A4 aspect ratio placeholder keeps scrollbar accurate before a page renders.
    width: "calc(100% - 32px)",
    paddingTop: "141.4%",
    margin: "8px auto",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
  },
  spinnerWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    width: "100%",
    color: "#fff"
  }
}));

// ── HEAD check ────────────────────────────────────────────────────────────────
// Conservative: presumes range requests are NOT supported unless the server
// explicitly confirms otherwise. Without range support we only allow loading
// when the file size is known and ≤ MAX_UNRANGED_BYTES, to avoid locking up
// the frontend with a huge unbounded download.
async function checkPdfUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const acceptRanges = res.headers.get("Accept-Ranges");
    const contentLength = res.headers.get("Content-Length");
    const fileSize = contentLength ? parseInt(contentLength, 10) : null;

    // Range support explicitly confirmed → always allow.
    if (acceptRanges && acceptRanges !== "none") {
      return { canLoad: true, supportsRange: true, fileSize };
    }

    // Range not supported or unknown → only allow when size is confirmed ≤ limit.
    if (fileSize !== null && fileSize <= MAX_UNRANGED_BYTES) {
      return { canLoad: true, supportsRange: false, fileSize };
    }

    return { canLoad: false, supportsRange: false, fileSize };
  } catch {
    // Request failed → cannot confirm range support; block to avoid lockup.
    return { canLoad: false, supportsRange: false, fileSize: null };
  }
}

// ── Lazy per-page renderer ────────────────────────────────────────────────────
// Renders a page only when it scrolls within 400 px of the viewport.
// A placeholder with an A4 aspect ratio keeps the scrollbar accurate.
function LazyPdfPage({ pdf, pageNum, classes }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTriggered = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !pdf) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting || renderTriggered.current) return;
        renderTriggered.current = true;
        observer.disconnect();

        let cancelled = false;
        (async () => {
          try {
            const page = await pdf.getPage(pageNum);
            if (cancelled) return;
            const containerWidth = el.parentElement?.clientWidth || 700;
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(containerWidth / viewport.width, 2);
            const scaledViewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            if (!canvas || cancelled) return;
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            await page.render({
              canvasContext: canvas.getContext("2d"),
              viewport: scaledViewport
            }).promise;
            if (!cancelled) setDone(true);
          } catch {
            // silent – placeholder stays
          }
        })();

        return () => {
          cancelled = true;
        };
      },
      { rootMargin: "400px" } // start loading before the page enters view
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pdf, pageNum]);

  return (
    <div ref={wrapperRef}>
      {!done && <div className={classes.pagePlaceholder} />}
      <canvas
        ref={canvasRef}
        className={classes.pageCanvas}
        style={{ display: done ? "block" : "none" }}
      />
    </div>
  );
}

// ── Thumbnail sub-component ───────────────────────────────────────────────────
function Thumbnail({ url, onOpen }) {
  const classes = useStyles();
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | done | error

  useEffect(() => {
    if (!url) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const pdf = await getDocument({
          url,
          // Only fetch what's needed for page 1 – don't pre-load the whole file.
          disableAutoFetch: true,
          disableStream: true,
          rangeChunkSize: 65536 // 64 KB chunks
        }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        const canvas = canvasRef.current;
        if (!canvas) {
          pdf.destroy();
          return;
        }

        const page = await pdf.getPage(1);
        if (cancelled) {
          pdf.destroy();
          return;
        }

        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Draw only the top half of the first page
        canvas.width = scaledViewport.width;
        canvas.height = Math.floor(scaledViewport.height / 2);
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: scaledViewport
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
        <div className={classes.thumbnailMessage}>Loading preview...</div>
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
}

// ── Full-viewer dialog ────────────────────────────────────────────────────────
function PdfViewerDialog({ url, fileName, open, onClose }) {
  const classes = useStyles();
  const contentRef = useRef(null);
  const pdfRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [viewerStatus, setViewerStatus] = useState("loading"); // loading | done | error

  // When the browser has a native PDF viewer we skip PDF.js entirely.
  useEffect(() => {
    if (!open || BROWSER_HAS_PDF_VIEWER) return;

    if (!url) {
      setViewerStatus("error");
      return;
    }

    let cancelled = false;
    setViewerStatus("loading");
    setNumPages(0);

    (async () => {
      try {
        const pdf = await getDocument({
          url,
          disableAutoFetch: true, // don't bulk-download; fetch chunks on demand
          rangeChunkSize: 65536 // 64 KB per range request
        }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setViewerStatus("done");
      } catch (e) {
        if (!cancelled) {
          console.error("PdfViewer load error:", e);
          setViewerStatus("error");
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

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    const sep = url.includes("?") ? "&" : "?";
    a.href = `${url}${sep}t=${Date.now()}`;
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

      <DialogContent
        className={
          BROWSER_HAS_PDF_VIEWER
            ? classes.dialogContentIframe
            : classes.dialogContent
        }
        ref={contentRef}
      >
        {BROWSER_HAS_PDF_VIEWER ? (
          <iframe
            className={classes.pdfIframe}
            src={`${url}${url.includes("?") ? "&" : "?"}inline=1`}
            title={fileName || "PDF Document"}
          />
        ) : (
          <>
            {viewerStatus === "loading" && (
              <div className={classes.spinnerWrap}>
                <CircularProgress color="inherit" />
              </div>
            )}
            {viewerStatus === "error" && (
              <div className={classes.spinnerWrap}>
                <Typography color="inherit">Failed to load PDF.</Typography>
              </div>
            )}
            {viewerStatus === "done" &&
              Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <LazyPdfPage
                  key={pageNum}
                  pdf={pdfRef.current}
                  pageNum={pageNum}
                  classes={classes}
                />
              ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
function PdfPreview({ url, fileName }) {
  const [open, setOpen] = useState(false);
  // null = pending, true = can load, false = blocked
  const [canLoad, setCanLoad] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setCanLoad(null);

    checkPdfUrl(url).then(result => {
      if (!cancelled) setCanLoad(result.canLoad);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // canLoad===null means HEAD check is still in-flight; canLoad===false means
  // range is unsupported and file exceeds 10 MB → fall back to the normal
  // document download button already rendered in the messages list.
  if (!canLoad) return null;

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
}

export default PdfPreview;
