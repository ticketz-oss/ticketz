import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Typography,
  makeStyles
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import { getIconComponent } from "../IconPicker/icons";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";

const useStyles = makeStyles(theme => ({
  sectionTitle: {
    // Alinha com o padding do grid abaixo.
    padding: theme.spacing(2, 2, 0)
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: theme.spacing(2),
    padding: theme.spacing(2)
  },
  card: {
    height: "100%"
  },
  action: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: theme.spacing(2),
    textAlign: "left"
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.borderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1.5)
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    flexGrow: 1
  },
  counts: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5)
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1)
  },
  empty: {
    padding: theme.spacing(3),
    color: theme.palette.text.secondary
  }
}));

// title e opcional: a tela do tenant renderiza duas instancias rotuladas
// ("Plataforma" e a propria empresa) e o portal do parceiro, uma so, sem rotulo.
const CategoryGrid = ({ groups, onSelect, title }) => {
  const classes = useStyles();

  if (!groups.length) {
    return (
      <Typography className={classes.empty}>{i18n.t("helps.empty")}</Typography>
    );
  }

  const describe = group => {
    const parts = [];

    if (group.articleCount) {
      parts.push(
        `${group.articleCount} ${i18n.t(
          group.articleCount === 1 ? "helps.articleOne" : "helps.articleOther"
        )}`
      );
    }

    if (group.videoCount) {
      parts.push(
        `${group.videoCount} ${i18n.t(
          group.videoCount === 1 ? "helps.videoOne" : "helps.videoOther"
        )}`
      );
    }

    return parts.join(" • ");
  };

  return (
    <Box>
      {title ? (
        <Typography variant="h6" className={classes.sectionTitle}>
          {title}
        </Typography>
      ) : null}
      <Box className={classes.grid}>
        {groups.map(group => {
          const Icon = getIconComponent(group.icon);

          return (
            <Card
              key={group.id}
              className={`${classes.card} sv-library-card`}
              variant="outlined"
            >
              <CardActionArea
                className={classes.action}
                onClick={() => onSelect(group)}
              >
                <Box className={`${classes.iconBox} sv-library-icon`}>
                  <Icon fontSize="large" />
                </Box>
                <Box className={classes.titleRow}>
                  <Typography variant="h6">{group.title}</Typography>
                  {group.adminOnly ? (
                    <Chip
                      size="small"
                      color="primary"
                      icon={<LockOutlinedIcon />}
                      label={i18n.t("helps.adminOnly")}
                    />
                  ) : null}
                </Box>
                {group.subtitle ? (
                  <Typography variant="body2" className={classes.subtitle}>
                    {group.subtitle}
                  </Typography>
                ) : (
                  <Box className={classes.subtitle} />
                )}
                <Typography variant="caption" className={classes.counts}>
                  {describe(group)}
                </Typography>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default CategoryGrid;
