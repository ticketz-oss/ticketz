import React, { useState } from "react";
import {
  Box,
  Breadcrumbs,
  Card,
  CardActionArea,
  Chip,
  Link,
  Typography,
  makeStyles
} from "@material-ui/core";
import DescriptionIcon from "@material-ui/icons/Description";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";

import { i18n } from "../../translate/i18n";
import { getIconComponent } from "../IconPicker/icons";
import parseYoutubeId from "../../helpers/parseYoutubeId";
import VideoPlayerModal from "./VideoPlayerModal";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3)
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.borderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main
  },
  section: {
    marginBottom: theme.spacing(4)
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5)
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: theme.spacing(2)
  },
  thumb: {
    width: "100%",
    aspectRatio: "16 / 9",
    objectFit: "cover",
    display: "block",
    backgroundColor: theme.palette.action.hover
  },
  thumbFallback: {
    width: "100%",
    aspectRatio: "16 / 9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.secondary
  },
  cardBody: {
    padding: theme.spacing(1.5),
    textAlign: "left",
    width: "100%"
  },
  meta: {
    color: theme.palette.text.secondary
  },
  articleCard: {
    padding: theme.spacing(2),
    textAlign: "left",
    width: "100%"
  },
  empty: {
    color: theme.palette.text.secondary
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1)
  }
}));

// hqdefault e a unica resolucao que o YouTube garante para qualquer video.
const YOUTUBE_THUMB = videoId =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

/**
 * Capa do card. Sem id do YouTube (video hospedado fora) — ou quando o YouTube
 * nao devolve a imagem — cai num bloco com o icone de play, em vez de deixar um
 * <img> quebrado na tela.
 */
const VideoThumb = ({ videoId, title, classes }) => {
  const [failed, setFailed] = useState(false);

  if (!videoId || failed) {
    return (
      <Box className={classes.thumbFallback}>
        <PlayCircleOutlineIcon fontSize="large" />
      </Box>
    );
  }

  return (
    <img
      className={classes.thumb}
      src={YOUTUBE_THUMB(videoId)}
      alt={title}
      onError={() => setFailed(true)}
    />
  );
};

const CategoryDetail = ({ group, onBack, onOpenArticle }) => {
  const classes = useStyles();
  const Icon = getIconComponent(group.icon);
  const [player, setPlayer] = useState(null);

  const openVideo = video => {
    // O backend ja grava o id normalizado; o parse aqui cobre registros antigos
    // que guardaram a URL inteira.
    const videoId = parseYoutubeId(video.video);

    if (videoId) {
      setPlayer({ videoId, title: video.title });
      return;
    }

    // Video fora do YouTube: nao da para embutir, entao abre na origem.
    if (video.link) {
      window.open(video.link, "_blank", "noopener,noreferrer");
    }
  };

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
        <Typography color="textPrimary">{group.title}</Typography>
      </Breadcrumbs>

      <Box className={classes.header}>
        <Box className={`${classes.iconBox} sv-library-icon`}>
          <Icon fontSize="large" />
        </Box>
        <Box>
          <Box className={classes.titleRow}>
            <Typography variant="h5">{group.title}</Typography>
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
            <Typography variant="body2" className={classes.meta}>
              {group.subtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>

      {group.videos.length ? (
        <Box className={classes.section}>
          <Box className={classes.sectionTitle}>
            <PlayCircleOutlineIcon color="primary" />
            <Typography variant="h6">{i18n.t("helps.videos")}</Typography>
          </Box>
          <Box className={classes.grid}>
            {group.videos.map(video => (
              <Card
                key={video.id}
                className="sv-library-card"
                variant="outlined"
              >
                <CardActionArea onClick={() => openVideo(video)}>
                  <VideoThumb
                    videoId={parseYoutubeId(video.video)}
                    title={video.title}
                    classes={classes}
                  />
                  <Box className={classes.cardBody}>
                    <Box className={classes.titleRow}>
                      <Typography variant="subtitle1">{video.title}</Typography>
                      {video.adminOnly ? (
                        <Chip
                          size="small"
                          color="primary"
                          icon={<LockOutlinedIcon />}
                          label={i18n.t("helps.adminOnly")}
                        />
                      ) : null}
                    </Box>
                    {video.description ? (
                      <Typography variant="body2" className={classes.meta}>
                        {video.description}
                      </Typography>
                    ) : null}
                    {video.duration ? (
                      <Typography variant="caption" className={classes.meta}>
                        {video.duration}
                      </Typography>
                    ) : null}
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      ) : null}

      {group.articles.length ? (
        <Box className={classes.section}>
          <Box className={classes.sectionTitle}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6">{i18n.t("helps.articles")}</Typography>
          </Box>
          <Box className={classes.grid}>
            {group.articles.map(article => (
              <Card
                key={article.id}
                className="sv-library-card"
                variant="outlined"
              >
                <CardActionArea onClick={() => onOpenArticle(article)}>
                  <Box className={classes.articleCard}>
                    <Box className={classes.titleRow}>
                      <Typography variant="subtitle1">
                        {article.title}
                      </Typography>
                      {article.adminOnly ? (
                        <Chip
                          size="small"
                          color="primary"
                          icon={<LockOutlinedIcon />}
                          label={i18n.t("helps.adminOnly")}
                        />
                      ) : null}
                    </Box>
                    {article.description ? (
                      <Typography variant="body2" className={classes.meta}>
                        {article.description}
                      </Typography>
                    ) : null}
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      ) : null}

      {!group.videos.length && !group.articles.length ? (
        <Typography className={classes.empty}>
          {i18n.t("helps.emptyGroup")}
        </Typography>
      ) : null}

      <VideoPlayerModal
        open={!!player}
        videoId={player?.videoId}
        title={player?.title || i18n.t("helps.player.title")}
        onClose={() => setPlayer(null)}
      />
    </Box>
  );
};

export default CategoryDetail;
