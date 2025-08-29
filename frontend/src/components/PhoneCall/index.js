import React, { useState, useRef, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Popover from "@material-ui/core/Popover";
import Button from "@material-ui/core/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import { CallEnd } from "@material-ui/icons";
import { PhoneCallContext } from "../../context/PhoneCall/PhoneCallContext";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  "@keyframes fadeInOut": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.3 },
    "100%": { opacity: 1 },
  },
  popoverPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  phoneIcon: {
    color: "#ffffff",
    fontSize: "24px",
    animation: "$fadeInOut 2s infinite",
  },
}));

export function PhoneCall() {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const anchorEl = useRef();
  // Destructure the current call state, update function, and disconnect function
  const { currentCall, disconnect } = useContext(PhoneCallContext);

  const handleIconClick = () => {
    setIsOpen(true);
  };

  const handleClosePopover = () => {
    setIsOpen(false);
  };

  const handleEndCall = () => {
    console.log("Call ended");
    disconnect();
    handleClosePopover();
  };

  return (
    <>
      {currentCall &&
        <IconButton ref={anchorEl} onClick={handleIconClick} aria-label="Phone Call">
          <FontAwesomeIcon icon={faPhone} className={classes.phoneIcon} />
        </IconButton>
      }
      <Popover
        open={isOpen}
        anchorEl={anchorEl.current}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        classes={{ paper: classes.popoverPaper }}
      >
        <div>{ currentCall?.contact?.name || currentCall?.contact?.number || "" }</div>
        <Button variant="contained" color="secondary" onClick={handleEndCall}>
          <CallEnd style={{ marginRight: 8 }} />
          {i18n.t("phoneCall.hangup")}
        </Button>
      </Popover>
    </>
  );
}
