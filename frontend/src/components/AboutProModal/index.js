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
  ticketzLogoImg: {
    width: "100%",
    margin: "0 auto",
    content: "url(" + (theme.mode === "light" ? logo : logoDark) + ")"
  },
  textCenter: {
    textAlign: "center",
  }

}));

const AboutProModal = ({ open, onClose }) => {
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
				maxWidth="sm"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{i18n.t("about.aboutthe")} {currentUser?.super ? "Ticketz PRO" : theme.appName }
				</DialogTitle>
				<DialogContent dividers>
				{ currentUser?.super ? 
          <>
            <div>
              <img className={classes.ticketzLogoImg} />
            </div>
            <Typography variant="body1">{i18n.t("aboutpro.aboutdetail")}</Typography>
            <Typography variant="h4">{i18n.t("aboutpro.licenseheading")}</Typography>
            <Typography variant="body1">{i18n.t("aboutpro.licensedetail")}</Typography>
            <Typography>© 2024 - TODOBOM.COM Tecnologia da Informação Ltda</Typography>
            <Typography>© 2024 - Claudemir Todo Bom</Typography>
            <Typography><Link target="_blank" href="https://pro.ticke.tz">Ticketz PRO Website</Link></Typography>
          </>
          :
          <>
            <div>
              <img className={classes.logoImg} />
            </div>
            <Typography className={classes.textCenter} style={{ display: "none"}}><Link target="_blank" href="https://ticke.tz">{i18n.t("about.copyright")}</Link></Typography>
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

export default AboutProModal;
