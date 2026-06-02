import React from "react";
import clsx from "clsx";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

import { i18n } from "../../translate/i18n";

const TicketzProAd = ({
  classes,
  proInstructionsOpen,
  onShowProInstructions,
  hasCommitHash
}) => {
  const isPtLanguage = (i18n.language || "").toLowerCase() === "pt";
  const monthlyPrice = isPtLanguage ? "R$ 199" : "US$ 49";

  return (
    <Paper
      className={clsx(classes.ticketzProPaper, {
        [classes.clickpointer]: !proInstructionsOpen
      })}
      onClick={onShowProInstructions}
    >
      <Grid
        container
        justifyContent="flex-end"
        alignItems={proInstructionsOpen ? "flex-start" : "center"}
        spacing={proInstructionsOpen ? 0 : 1}
      >
        <Grid className={classes.ticketzProBox} item xs={12} sm={4} md={3}>
          <div>
            <img
              className={classes.ticketzProScreen}
              src="https://pro.ticke.tz/images/0/7/3/0/b/0730b234af7b4b0dac72d09828863bb7cb9193ea-ticketz-computador.png"
              alt={i18n.t("ticketz.proAd.imageAlt")}
            />
          </div>
        </Grid>

        {!proInstructionsOpen && (
          <Grid
            className={clsx(classes.ticketzProBox, classes.ticketzProTextBox)}
            item
            xs={12}
            sm={8}
            md={9}
          >
            <Typography
              className={classes.ticketzProTitle}
              component="h3"
              variant="h6"
              gutterBottom
            >
              {i18n.t("ticketz.proAd.title")}
            </Typography>

            <Typography component="div" variant="body2" gutterBottom>
              <ul className={classes.ticketzProFeatures}>
                <li>{i18n.t("ticketz.proAd.features.officialChannels")}</li>
                <li>{i18n.t("ticketz.proAd.features.exclusiveFeatures")}</li>
                <li>{i18n.t("ticketz.proAd.features.advancedSupport")}</li>
                <li>{i18n.t("ticketz.proAd.features.easyMigration")}</li>
              </ul>
            </Typography>

            <Typography component="h3" variant="h6">
              {i18n.t("ticketz.proAd.subscribePrice", { monthlyPrice })}
            </Typography>

            <Typography component="p" variant="body2" gutterBottom>
              {i18n.t("ticketz.proAd.subscribeSubtitle")}
            </Typography>

            {hasCommitHash && (
              <Typography component="h4" variant="subtitle1">
                {i18n.t("ticketz.proAd.ctaUpgrade")}
              </Typography>
            )}

            {!hasCommitHash && (
              <Typography component="h3" variant="subtitle1">
                {i18n.t("ticketz.proAd.ctaVisitSite")}
              </Typography>
            )}
          </Grid>
        )}

        {proInstructionsOpen && (
          <Grid
            className={clsx(classes.ticketzProBox, classes.ticketzProTextBox)}
            item
            xs={12}
            sm={8}
            md={9}
          >
            <Typography
              className={classes.ticketzProTitle}
              component="h3"
              variant="h5"
              gutterBottom
            >
              {i18n.t("ticketz.proAd.instructions.title")}
            </Typography>

            <Typography paragraph>
              {i18n.t("ticketz.proAd.instructions.stepIntro")}
            </Typography>

            <Typography className={classes.ticketzProCommand} paragraph>
              curl -sSL update.ticke.tz | sudo bash -s pro
            </Typography>

            <Typography paragraph>
              {i18n.t("ticketz.proAd.instructions.stepInstall")}
            </Typography>

            <Typography paragraph>
              {i18n.t("ticketz.proAd.instructions.helpPrefix")}
              <a href="https://wa.me/554935670707">
                {i18n.t("ticketz.proAd.instructions.helpLink")}
              </a>
              {i18n.t("ticketz.proAd.instructions.helpSuffix")}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default TicketzProAd;
