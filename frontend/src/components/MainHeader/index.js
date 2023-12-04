import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import WhatsappBackground from "../../assets/wa-background.png"
const useStyles = makeStyles(theme => ({
	contactsHeader: {
		display: "flex",
		alignItems: "center",
		padding: "0px 6px 6px 6px",
		backgroundImage: `url(${WhatsappBackground})`,
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
