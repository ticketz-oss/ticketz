import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";

import ModalImage from "react-modal-image";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
	messageMedia: {
		objectFit: "cover",
		width: "100%",
		height: 200,
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
	},

  messageMediaSticker: {
    width: 200,
    height: 200,
  },
	
	messageMediaDeleted: {
    filter: "grayscale(1)",
    opacity: 0.4
  }
}));

const ModalImageCors = ({ imageUrl, isDeleted , data }) => {
	const classes = useStyles();

	return (
		<ModalImage
			className={[clsx(classes.messageMedia, {
        [classes.messageMediaDeleted] : isDeleted,
        [classes.messageMediaSticker] : data && ("stickerMessage" in data.message)
      })]}
			smallSrcSet={imageUrl}
			medium={imageUrl}
			large={imageUrl}
			showRotate={true}
			imageBackgroundColor="unset"
			alt="image"
		/>
	);
};

export default ModalImageCors;
