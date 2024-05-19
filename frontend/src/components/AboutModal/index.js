import React, { useState, useEffect } from "react";


import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Dialog,
  Link,
  Typography,
  DialogActions,
  DialogContent,
  DialogTitle
} from "@material-ui/core";

import { getBackendURL } from "../../services/config";

import { i18n } from "../../translate/i18n";
import useAuth from "../../hooks/useAuth.js";
import { useTheme } from "@material-ui/core/styles";

const logo = "/vector/logo.svg";
const logoDark = "/vector/logo-dark.svg";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
	},
  logoImg: {
    width: "100%",
    margin: "0 auto",
    content: "url(" + ((theme.appLogoLight || theme.appLogoDark) ? getBackendURL()+"/public/"+  (theme.mode === "light" ? theme.appLogoLight || theme.appLogoDark : theme.appLogoDark || theme.appLogoLight  )   : (theme.mode === "light" ? logo : logoDark)) + ")"
  },
  textCenter: {
    textAlign: "center",
  }

}));

const AboutModal = ({ open, onClose }) => {
	const classes = useStyles();
  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});
  const theme = useTheme();


	const handleClose = () => {
		onClose();
	};

  useEffect(() => {
    getCurrentUserInfo().then(
      (user) => {
        setCurrentUser(user);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{i18n.t("about.aboutthe")} {currentUser?.super ? "ticketz" : theme.appName }
				</DialogTitle>
				<DialogContent dividers>
				{ currentUser?.super ? 
          <>
            <Typography variant="body1">{i18n.t("about.aboutdetail")}</Typography>
            <Typography><Link target="_blank" href="https://todobom.com">{i18n.t("about.aboutauthorsite")}</Link></Typography>
            <Typography><Link target="_blank" href="https://github.com/canove/whaticket-community">{i18n.t("about.aboutwhaticketsite")}</Link></Typography>
            <Typography><Link target="_blank" href="https://github.com/vemfazer">{i18n.t("about.aboutvemfazersite")}</Link></Typography>
            <Typography variant="h4">{i18n.t("about.licenseheading")}</Typography>
            <Typography variant="body1">{i18n.t("about.licensedetail")}</Typography>
            <Typography><Link target="_blank" href="https://github.com/ticketz-oss/ticketz/blob/main/LICENSE.md">{i18n.t("about.licensefulltext")}</Link></Typography>
            <Typography><Link target="_blank" href="https://github.com/ticketz-oss/ticketz">{i18n.t("about.licensesourcecode")}</Link></Typography>
          </>
          :
          <>
            <div>
              <img className={classes.logoImg} />
            </div>
            <Typography className={classes.textCenter} ><Link target="_blank" href="https://ticke.tz">{i18n.t("about.copyright")}</Link></Typography>
          </>
        }
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleClose}
            type="submit"
            color="primary"
            variant="contained"
					>
						{i18n.t("about.buttonclose")}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default AboutModal;
