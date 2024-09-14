import React from "react";
import Typography from "@material-ui/core/Typography";

export default function Title(props) {
	return (
		<Typography className={props.className} variant="h5" color="primary" gutterBottom>
			{props.children}
		</Typography>
	);
}
