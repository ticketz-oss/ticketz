import React from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  makeStyles
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles(theme => ({
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2)
  },
  content: {
    padding: 0
  },
  // Wrapper 16:9: o iframe do YouTube nao tem altura intrinseca, entao a
  // proporcao vem do padding-bottom do container.
  frame: {
    position: "relative",
    width: "100%",
    paddingBottom: "56.25%",
    backgroundColor: theme.palette.common.black,
    "& iframe": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      border: 0
    }
  }
}));

const VideoPlayerModal = ({ open, videoId, title, onClose }) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle disableTypography className={classes.title}>
        <Typography variant="h6">{title}</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className={classes.content}>
        <Box className={classes.frame}>
          {/* Montado so quando aberto: senao o iframe continuaria carregado (e
              com autoplay) atras do modal fechado. */}
          {open && videoId ? (
            <iframe
              title={title}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerModal;
