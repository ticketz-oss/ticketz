import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";

import ModalImage from "react-modal-image";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
	messageMedia: {
		objectFit: "cover",
		width: 250,
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
	const [fetching, setFetching] = useState(true);
	const [blobUrl, setBlobUrl] = useState("");

	useEffect(() => {
		if (!imageUrl) return;
		const fetchImage = async () => {
			const { data, headers } = await api.get(imageUrl, {
				responseType: "blob",
			});
			const url = window.URL.createObjectURL(
				new Blob([data], { type: headers["content-type"] })
			);
			setBlobUrl(url);
			setFetching(false);
		};
		fetchImage();
	}, [imageUrl]);

	return (
		<ModalImage
			className={[clsx(classes.messageMedia, {
        [classes.messageMediaDeleted] : isDeleted,
        [classes.messageMediaSticker] : data && ("stickerMessage" in data.message)
      })]}
			smallSrcSet={fetching ? imageUrl : blobUrl}
			medium={fetching ? imageUrl : blobUrl}
			large={fetching ? imageUrl : blobUrl}
			imageBackgroundColor="unset"
			alt="image"
		/>
	);
};

export default ModalImageCors;
