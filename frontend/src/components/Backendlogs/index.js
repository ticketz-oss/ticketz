import React, { useState, useRef, useContext, useEffect } from "react";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { makeStyles } from "@material-ui/core/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBug, faTrash, faFileImport, faFileExport } from "@fortawesome/free-solid-svg-icons";
import { i18n } from "../../translate/i18n";
import { SocketContext } from "../../context/Socket/SocketContext";

import { FormControl, Grid, InputBase, InputLabel, MenuItem, Select, TextField } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  tabContainer: {
    padding: theme.spacing(2),
  },
  popoverPaper: {
    width: "80%",
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    padding: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100%",
    },
  },
  noShadow: {
    boxShadow: "none !important",
  },
  icons: {
    color: "#fff",
  },
  customBadge: {
    backgroundColor: "#f44336",
    color: "#fff",
  },
  console: {
    height: "400px",
    width: "100%",
    backgroundColor: "#000",
    color: "#fff",
    padding: theme.spacing(2),
    overflowY: "auto",
    overflowX: "auto",
    fontFamily: "monospace",
    "&::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#555",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "#888",
    },
    "&::-webkit-scrollbar-button": {
      display: "none",
    },
  },
  logline: {
    display: "flex",
    alignItems: "flex-start",
    cursor: "text",
    "&:hover": {
      backgroundColor: "#333",
    },    
  },
  logMetadata: {
    flexShrink: 0,
    margin: 0,
  },
  logExpand: {
    flexShrink: 0,
    marginLeft: 8,
    cursor: "pointer",
  },
  logMessage: {
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    margin: 0,
    marginLeft: 8
  },
  logDetails: {
    flexGrow: 1,
    overflow: "auto",
    margin: 0,
    marginLeft: 8,
    maxHeight: 200,
    "&::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#555",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "#888",
      cursor: "default",
    },
    "&::-webkit-scrollbar-button": {
      display: "none",
    },
  },
  grid: {
    padding: theme.spacing(2),
  },
  error: {
    fontWeight: "bold",
    color: "red",
  },
  warn: {
    fontWeight: "bold",
    color: "yellow",
  },
  info: {
    fontWeight: "bold",
    color: "green",
  },
  debug: {
    fontWeight: "bold",
    color: "blue",
  },
  trace: {
    fontWeight: "bold",
    color: "gray",
  },
}));

function processLogInfo(logInfo) {
  const { logs } = logInfo;
  const details = [];
  let message = "";

  if (!logs || logs.length === 0) {
    return { details, message: "" };
  }
  
  logs.forEach((log) => {
    if (typeof log === "string") {
      message += log + "\n";
    } else {
      details.push(log);
    }
  });
  message = message.trim();
  return { details, message };
}

function LogLine({ logInfo, filter }) {
  const classes = useStyles();
  const [ expanded, setExpanded ] = useState(false);

  const { details, message } = processLogInfo(logInfo);
  
  if (filter && filter.length > 0) {
    if (!message.toLowerCase().includes(filter.toLowerCase()) && 
        !JSON.stringify(details).toLowerCase().includes(filter.toLowerCase())
      ) {
      return null;
    }
  }

  const { timestamp, level } = logInfo;

  let levelName;
  let levelClass = classes.info;
  
  if (level >= 50) {
    levelName = "ERROR";
    levelClass = classes.error;
  } else if (level >= 40) {
    levelName = "WARN ";
    levelClass = classes.warn;
  } else if (level >= 30) {
    levelName = "INFO ";
    levelClass = classes.info;
  } else if (level >= 20) {
    levelName = "DEBUG";
    levelClass = classes.debug;
  } else {
    levelName = "TRACE";
    levelClass = classes.trace;
  }
  
  const toggleExpand = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  }
  
  return (
    <div className={classes.logline}>
      <pre className={classes.logMetadata}>
        {new Date(timestamp).toLocaleString()}&nbsp;
        <span className={levelClass}>{levelName}</span>
      </pre>
      {details?.length ?
        <div
          className={classes.logExpand}
          onClick={(e) => toggleExpand()}
        >{ expanded ? "▼" : "▶" }</div>
        :
        <div className={classes.logExpand}>&nbsp;</div>
      }
      {expanded ?
        <div className={classes.logDetails}>
          {message}
          <br />
          {details.map((detail, _index) => {
            return (
              <pre>
                { JSON.stringify(detail, null, 2) }
              </pre>
            );
          }
          )}
        </div>
        :
        <pre className={classes.logMessage}>{message}</pre>
      }
    </div>
  );
}

export function Backendlogs() {
  const classes = useStyles();
  const consoleRef = useRef();
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logLevel, setLogLevel] = useState("");
  const [filter, setFilter] = useState("");

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const socket = socketManager.GetSocket();

    socket.on("backendlog", (logInfo) => {
      const isAtBottom = consoleRef.current &&
        parseInt(consoleRef.current.scrollHeight - consoleRef.current.scrollTop) <=
        consoleRef.current.clientHeight;
        
      consoleRef.current && console.log({
        scrollHeight: consoleRef.current.scrollHeight,
        scrollTop: consoleRef.current.scrollTop,
        position: consoleRef.current.scrollHeight - consoleRef.current.scrollTop,
        clientHeight: consoleRef.current.clientHeight,
        isAtBottom
      });

      if (logInfo.logs?.[0].currentLevel) {
        setLogLevel(logInfo.logs[0].currentLevel);
      }
      setLogs((prevLogs) => [...prevLogs, logInfo]);
      
      if (isAtBottom) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);
  
  useEffect(() => {
    if (!logLevel) return;

    const socket = socketManager.GetSocket();
    socket.emit("setLoglevel", logLevel);
  }, [logLevel, socketManager]);

  useEffect(() => {
    setTimeout(() => {
      if (!consoleRef.current) return;
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }, 500);
  }, [isOpen]);
  
  const handleClick = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
    if (consoleRef.current) {
      consoleRef.current.scrollTop = 0;
    }
  };

  const handleLoggingToggle = (event) => {
    const socket = socketManager.GetSocket();

    if (event.target.checked) {
      handleClearLogs();
      socket.emit("joinBackendlog");
      setIsLoggingEnabled(true);
    } else {
      socket.emit("leaveBackendlog");
      setIsLoggingEnabled(false);
    }
  };

  const handleLogLevelChange = (event) => {
    setLogLevel(event.target.value);
  };
  
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedLogs = JSON.parse(e.target.result);
          setLogs((prevLogs) => [...prevLogs, ...importedLogs]);
        } catch (error) {
          console.error("Failed to import logs:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  const handleExport = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "backend_logs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <>
      <IconButton
        className={classes.icons}
        onClick={handleClick}
        ref={anchorEl}
        aria-label="Backend Logs"
      >
        <FontAwesomeIcon icon={faBug} />
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <Grid container className={classes.grid} spacing={2}>
          <Grid item md={2} xs={12}>
            <FormControl fullWidth>
              <InputLabel>Log Level</InputLabel>
              <Select value={logLevel} onChange={handleLogLevelChange}>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
                <MenuItem value="trace">Trace</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item md={4} xs={12}>
            <FormControl fullWidth>
              <TextField
                label={i18n.t("common.filter")}
                name="filter"
                variant="standard"
                onChange={(e) => setFilter(e.target.value)}
              />
            </FormControl>
          </Grid>
              
          <Grid item md={6} xs={12} container justifyContent="flex-end" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={isLoggingEnabled}
                  onChange={handleLoggingToggle}
                  color="primary"
                />
              }
              label={i18n.t("common.enabled")}
              labelPlacement="end"
            />
            <IconButton
              className={classes.noShadow}
              onClick={handleClearLogs}
              aria-label="Clear Logs"
            >
              <FontAwesomeIcon icon={faTrash} />
            </IconButton>
            <IconButton
              className={classes.noShadow}
              onClick={handleImport}
              aria-label="Import Logs"
            >
              <FontAwesomeIcon icon={faFileImport} />
            </IconButton>
            <IconButton
              className={classes.noShadow}
              onClick={handleExport}
              aria-label="Export Logs"
            >
              <FontAwesomeIcon icon={faFileExport} />
            </IconButton>
          </Grid>
        </Grid>
        <div className={classes.console} ref={consoleRef}>
          {logs.map((log, index) => (
            <LogLine key={index} logInfo={log} filter={filter} />
          ))}
        </div>
      </Popover>
    </>
  );
}
