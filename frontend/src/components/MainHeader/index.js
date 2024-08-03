import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import whatsBackground from "../../assets/wa-background.png"
import whatsBackgroundDark from "../../assets/wa-background-dark.png";

const useStyles = makeStyles(theme => ({
	contactsHeader: {
		display: "flex",
		alignItems: "center",
		padding: "0px 6px 6px 6px",
		backgroundPosition: 'center', 
		backgroundSize: 'cover', 
		backgroundRepeat: 'no-repeat', 
	},
}));

const MainHeader = ({ children }) => {
	const classes = useStyles();

	return <div className={classes.contactsHeader}>{children}</div>;
};

export default MainHeader;
