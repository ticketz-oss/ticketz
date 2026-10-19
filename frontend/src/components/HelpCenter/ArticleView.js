import React from "react";
import {
  Box,
  Breadcrumbs,
  Chip,
  Link,
  Typography,
  makeStyles
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  },
  title: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  // O HTML vem sanitizado do backend; aqui só herda a tipografia do tema.
  content: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.primary,
    lineHeight: 1.7,
    "& img": {
      maxWidth: "100%",
      height: "auto"
    },
    "& a": {
      color: theme.palette.primary.main
    },
    "& blockquote": {
      borderLeft: `4px solid ${theme.palette.divider}`,
      margin: 0,
      paddingLeft: theme.spacing(2),
      color: theme.palette.text.secondary
    }
  }
}));

const ArticleView = ({ group, article, onBack, onBackToGroup }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Breadcrumbs>
        <Link
          color="inherit"
          href="#"
          onClick={event => {
            event.preventDefault();
            onBack();
          }}
        >
          {i18n.t("helps.title")}
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={event => {
            event.preventDefault();
            onBackToGroup();
          }}
        >
          {group.title}
        </Link>
        <Typography color="textPrimary">{article.title}</Typography>
      </Breadcrumbs>

      <Box className={classes.title}>
        <Typography variant="h5">{article.title}</Typography>
        {article.adminOnly ? (
          <Chip
            size="small"
            color="primary"
            icon={<LockOutlinedIcon />}
            label={i18n.t("helps.adminOnly")}
          />
        ) : null}
      </Box>

      <div
        className={`${classes.content} sv-library-article`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: article.content || "" }}
      />
    </Box>
  );
};

export default ArticleView;
