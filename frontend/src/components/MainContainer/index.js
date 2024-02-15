import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import whatsBackground from "../../assets/wa-background.png"
import whatsBackgroundDark from "../../assets/wa-background-dark.png";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		flex: 1,
		padding: theme.spacing(2),
		height: `calc(100% - 48px)`,
	    backgroundImage: theme.mode === 'light' ? `url(${whatsBackground})` : `url(${whatsBackgroundDark})`,
		backgroundPosition: 'center', 
		backgroundSize: 'cover', 
		backgroundRepeat: 'no-repeat',
	},

	contentWrapper: {
		height: "100%",
		overflowY: "hidden",
		display: "flex",
		flexDirection: "column",
	},
}));

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<Container className={classes.mainContainer}>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;
