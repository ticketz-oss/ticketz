import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import NavigateBeforeIcon from "@material-ui/icons/NavigateBefore";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import { i18n } from "../../translate/i18n";

const DEFAULT_TICKETZ_LOGO = "/vector/favicon.svg";
const SUPPORTED_BLOG_LANGUAGES = ["en", "pt", "es"];

function resolveBlogLanguage(language) {
  const code = (language || "").slice(0, 2).toLowerCase();
  return SUPPORTED_BLOG_LANGUAGES.includes(code) ? code : "en";
}

function getFeedUrl(language) {
  const locale = resolveBlogLanguage(language);
  return `https://pro.ticke.tz/${locale}/blog.json`;
}

const useStyles = makeStyles(theme => ({
  wrapper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: 0
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1)
  },
  body: {
    minHeight: 0,
    overflow: "hidden"
  },
  carouselContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(0.5)
  },
  navButton: {
    alignSelf: "center",
    padding: 4
  },
  carouselCard: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: theme.spacing(0.75),
    overflow: "hidden",
    cursor: "pointer"
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1),
    minHeight: 0
  },
  thumbnail: {
    width: 100,
    minWidth: 100,
    height: 100,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.action.hover,
    backgroundSize: "cover",
    backgroundPosition: "center"
  },
  headerText: {
    minWidth: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflow: "hidden"
  },
  title: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word"
  },
  previewWrap: {
    minHeight: 0,
    display: "flex",
    overflow: "hidden"
  },
  summary: {
    color: theme.palette.text.secondary,
    lineHeight: 1.35,
    minHeight: "calc(1.35em * 3)",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  publishedDate: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing(1)
  },
  progressContainer: {
    flexGrow: 1
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.palette.action.hover,
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.palette.primary.main,
    transition: "width 120ms linear"
  },
  progressBarNoAnimation: {
    transition: "none"
  },
  list: {
    height: "100%",
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 0),
    cursor: "pointer"
  },
  listThumb: {
    width: 52,
    minWidth: 52,
    height: 52,
    borderRadius: theme.spacing(0.75),
    backgroundColor: theme.palette.action.hover,
    backgroundSize: "cover",
    backgroundPosition: "center"
  },
  listText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  lineOne: {
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  lineTwo: {
    color: theme.palette.text.secondary,
    fontSize: "0.85rem",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  }
}));

function truncateText(text, maxLength = 220) {
  const normalizedText = (text || "").replace(/\s+/g, " ").trim();

  if (!normalizedText || normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

function stripHtml(html) {
  if (!html) {
    return "";
  }

  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveUrl(base, value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, base).toString();
  } catch (_error) {
    return value;
  }
}

function mapPost(item, feedBase) {
  const summarySource =
    item.summary || item.content_text || stripHtml(item.content_html);

  return {
    id: item.id || item.url,
    title: (item.title || "").replace(/\s+/g, " ").trim(),
    summary: truncateText(summarySource),
    image: resolveUrl(feedBase, item.image),
    url: resolveUrl(feedBase, item.url || item.id),
    publishedAt: item.date_published || item.date_modified || ""
  };
}

function sortByDateDesc(entries) {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime() || 0;
    const dateB = new Date(b.publishedAt).getTime() || 0;
    return dateB - dateA;
  });
}

function formatPublishedDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const preferredLocale = (i18n.resolvedLanguage || i18n.language || "en")
    .replace("_", "-")
    .trim();

  try {
    return new Intl.DateTimeFormat(preferredLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  } catch (_error) {
    return new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }
}

function PostImage({ src, className }) {
  const imageUrl = src || DEFAULT_TICKETZ_LOGO;
  const isFallback = !src;

  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: isFallback ? "contain" : "cover",
        backgroundRepeat: "no-repeat"
      }}
    />
  );
}

function CarouselPost({ entry }) {
  const classes = useStyles();
  const publishedDate = formatPublishedDate(entry?.publishedAt);

  if (!entry) {
    return null;
  }

  function openEntry() {
    window.open(entry.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={classes.carouselCard} onClick={openEntry}>
      <div className={classes.cardHeader}>
        <PostImage className={classes.thumbnail} src={entry.image} />
        <div className={classes.headerText}>
          <Typography
            component="h3"
            variant="subtitle1"
            className={classes.title}
          >
            {entry.title}
          </Typography>
          {publishedDate ? (
            <Typography className={classes.publishedDate}>
              {publishedDate}
            </Typography>
          ) : null}
        </div>
      </div>
      <div className={classes.previewWrap}>
        <Typography variant="body2" className={classes.summary}>
          {entry.summary}
        </Typography>
      </div>
    </div>
  );
}

export default function BlogFeedCarousel() {
  const classes = useStyles();
  const blogLanguage = resolveBlogLanguage(
    i18n.resolvedLanguage || i18n.language
  );
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    hoverRef.current = isHovering;
  }, [isHovering]);

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      setLoading(true);
      setError(false);

      try {
        const feedUrl = getFeedUrl(blogLanguage);
        const response = await fetch(feedUrl);
        const data = await response.json();
        const feedBase = data.home_page_url || data.feed_url || feedUrl;
        const items = Array.isArray(data.items) ? data.items : [];
        const mapped = items
          .map(item => mapPost(item, feedBase))
          .filter(item => item.id && item.title && item.url);

        if (!mounted) {
          return;
        }

        setEntries(sortByDateDesc(mapped));
      } catch (_error) {
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      mounted = false;
    };
  }, [blogLanguage]);

  const recentEntries = useMemo(() => entries.slice(0, 3), [entries]);
  const activeEntry = recentEntries[activeIndex] || null;

  function handlePrev() {
    if (!recentEntries.length) {
      return;
    }

    setAnimateProgress(false);
    setProgress(0);
    setActiveIndex(current =>
      current === 0 ? recentEntries.length - 1 : current - 1
    );
  }

  function handleNext() {
    if (!recentEntries.length) {
      return;
    }

    setAnimateProgress(false);
    setProgress(0);
    setActiveIndex(current => (current + 1) % recentEntries.length);
  }

  useEffect(() => {
    if (!recentEntries.length || expanded) {
      setAnimateProgress(false);
      setProgress(0);
      return undefined;
    }

    const cycleMs = 6000;
    const holdAtFullMs = 500;
    const tickMs = 100;
    let elapsedMs = 0;

    setAnimateProgress(false);
    setProgress(0);

    const enableAnimationTimeout = setTimeout(() => {
      setAnimateProgress(true);
    }, 30);

    const interval = setInterval(() => {
      if (hoverRef.current) {
        return;
      }

      elapsedMs += tickMs;

      if (elapsedMs < cycleMs) {
        setProgress((elapsedMs / cycleMs) * 100);
        return;
      }

      setProgress(100);

      if (elapsedMs >= cycleMs + holdAtFullMs) {
        setAnimateProgress(false);
        setProgress(0);
        setActiveIndex(prev => (prev + 1) % recentEntries.length);
      }
    }, tickMs);

    return () => {
      clearTimeout(enableAnimationTimeout);
      clearInterval(interval);
    };
  }, [activeIndex, expanded, recentEntries.length]);

  useEffect(() => {
    if (activeIndex > recentEntries.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, recentEntries.length]);

  if (loading || error) {
    return null;
  }

  return (
    <Paper
      className={classes.wrapper}
      elevation={3}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={classes.header}>
        <Typography component="h2" variant="h6">
          {i18n.t("dashboard.blog.title")}
        </Typography>
        <IconButton
          color="primary"
          onClick={() => setExpanded(value => !value)}
          title={
            expanded
              ? i18n.t("dashboard.blog.showLess")
              : i18n.t("dashboard.blog.showAll")
          }
          aria-label={
            expanded
              ? i18n.t("dashboard.blog.showLess")
              : i18n.t("dashboard.blog.showAll")
          }
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </div>

      {!loading && !error && !recentEntries.length ? (
        <Typography>{i18n.t("dashboard.blog.empty")}</Typography>
      ) : null}

      <div className={classes.body}>
        {!loading && !error && recentEntries.length && !expanded ? (
          <div className={classes.carouselContainer}>
            <Box flexGrow={1}>
              <CarouselPost entry={activeEntry} />
            </Box>
          </div>
        ) : null}

        {expanded && entries.length ? (
          <div className={classes.list} style={{ height: 230 }}>
            {entries.map(entry => (
              <div
                className={classes.listItem}
                key={entry.id}
                onClick={() =>
                  window.open(entry.url, "_blank", "noopener,noreferrer")
                }
              >
                <PostImage className={classes.listThumb} src={entry.image} />
                <div className={classes.listText}>
                  <Typography className={classes.lineOne}>
                    {entry.title}
                  </Typography>
                  <Typography className={classes.lineTwo}>
                    {entry.summary}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {expanded && !entries.length && !loading && !error ? (
          <Typography>{i18n.t("dashboard.blog.empty")}</Typography>
        ) : null}
      </div>

      {!loading && !error && recentEntries.length && !expanded ? (
        <div className={classes.footer}>
          <IconButton
            className={classes.navButton}
            onClick={handlePrev}
            aria-label={i18n.t("dashboard.blog.previous")}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <div className={classes.progressContainer}>
            <div className={classes.progressTrack}>
              <div
                className={`${classes.progressBar} ${
                  !animateProgress ? classes.progressBarNoAnimation : ""
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <IconButton
            className={classes.navButton}
            onClick={handleNext}
            aria-label={i18n.t("dashboard.blog.next")}
          >
            <NavigateNextIcon />
          </IconButton>
        </div>
      ) : null}
    </Paper>
  );
}
