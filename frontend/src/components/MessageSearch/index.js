import React, { useState, useEffect, useCallback, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  IconButton,
  InputBase,
  Typography,
  Paper,
} from "@material-ui/core";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@material-ui/icons";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  searchContainer: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  counter: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    whiteSpace: "nowrap",
    marginRight: 4,
    minWidth: 50,
    textAlign: "center",
  },
}));

const HIGHLIGHT_CLASS = "search-highlight";
const HIGHLIGHT_CURRENT_CLASS = "search-highlight-current";

const MessageSearch = ({ open, onClose, messageListRef }) => {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState("");
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const clearHighlights = useCallback(() => {
    if (!messageListRef?.current) return;
    const container = messageListRef.current;
    const highlighted = container.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    highlighted.forEach((el) => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  }, [messageListRef]);

  const applyHighlights = useCallback(
    (term) => {
      if (!messageListRef?.current || !term) return [];

      const container = messageListRef.current;
      const normalizedTerm = term.toLowerCase();
      const matchElements = [];

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (
              parent.closest(`.${HIGHLIGHT_CLASS}`) ||
              parent.tagName === "SCRIPT" ||
              parent.tagName === "STYLE" ||
              parent.closest("[class*='timestamp']") ||
              parent.closest("[class*='messageActionsButton']") ||
              parent.closest("[class*='TicketActionButtons']") ||
              parent.closest("[class*='messageContactName']")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            if (node.textContent.toLowerCase().includes(normalizedTerm)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          },
        }
      );

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      textNodes.forEach((textNode) => {
        const text = textNode.textContent;
        const lowerText = text.toLowerCase();
        const parent = textNode.parentNode;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let pos = lowerText.indexOf(normalizedTerm, lastIndex);

        while (pos !== -1) {
          if (pos > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastIndex, pos))
            );
          }
          const span = document.createElement("span");
          span.className = HIGHLIGHT_CLASS;
          span.textContent = text.substring(pos, pos + term.length);
          fragment.appendChild(span);
          matchElements.push(span);
          lastIndex = pos + term.length;
          pos = lowerText.indexOf(normalizedTerm, lastIndex);
        }

        if (lastIndex < text.length) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex))
          );
        }

        parent.replaceChild(fragment, textNode);
      });

      return matchElements;
    },
    [messageListRef]
  );

  const doSearch = useCallback(
    (term) => {
      clearHighlights();
      if (!term || term.length < 2) {
        setMatches([]);
        setCurrentIndex(-1);
        return;
      }
      const found = applyHighlights(term);
      setMatches(found);
      if (found.length > 0) {
        setCurrentIndex(0);
        found[0].classList.add(HIGHLIGHT_CURRENT_CLASS);
        found[0].scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setCurrentIndex(-1);
      }
    },
    [clearHighlights, applyHighlights]
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setSearchTerm("");
      setMatches([]);
      setCurrentIndex(-1);
      clearHighlights();
    }
  }, [open, clearHighlights]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 350);
  };

  const navigateTo = useCallback(
    (index) => {
      if (matches.length === 0) return;
      if (currentIndex >= 0 && currentIndex < matches.length) {
        matches[currentIndex].classList.remove(HIGHLIGHT_CURRENT_CLASS);
      }
      matches[index].classList.add(HIGHLIGHT_CURRENT_CLASS);
      matches[index].scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrentIndex(index);
    },
    [matches, currentIndex]
  );

  const handlePrev = () => {
    if (matches.length === 0) return;
    const newIdx = currentIndex <= 0 ? matches.length - 1 : currentIndex - 1;
    navigateTo(newIdx);
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const newIdx = currentIndex >= matches.length - 1 ? 0 : currentIndex + 1;
    navigateTo(newIdx);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleClose = () => {
    clearHighlights();
    onClose();
  };

  if (!open) return null;

  return (
    <Paper elevation={1} className={classes.searchContainer}>
      <SearchIcon color="action" fontSize="small" />
      <InputBase
        className={classes.searchInput}
        placeholder={i18n.t("messageSearch.placeholder")}
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        inputRef={inputRef}
        autoFocus
      />
      {searchTerm.length >= 2 && (
        <Typography className={classes.counter}>
          {matches.length > 0
            ? `${currentIndex + 1} / ${matches.length}`
            : i18n.t("messageSearch.noResults")}
        </Typography>
      )}
      <IconButton size="small" onClick={handlePrev} disabled={matches.length === 0}>
        <KeyboardArrowUp fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={handleNext} disabled={matches.length === 0}>
        <KeyboardArrowDown fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={handleClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default MessageSearch;
