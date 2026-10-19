import StardewEmblem from "../../components/StardewEmblem";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { makeStyles, Paper } from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import CategoryGrid from "../../components/HelpCenter/CategoryGrid";
import CategoryDetail from "../../components/HelpCenter/CategoryDetail";
import ArticleView from "../../components/HelpCenter/ArticleView";
import { i18n } from "../../translate/i18n";
import useHelpGroups from "../../hooks/useHelpGroups";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    width: "100%",
    minHeight: "200px",
    overflowY: "auto",
    ...theme.scrollbarStyles
  }
}));

const Helps = () => {
  const classes = useStyles();
  const history = useHistory();
  const { groupId, contentId } = useParams();
  const { listPublic, showPublic } = useHelpGroups();
  const { user } = useContext(AuthContext);

  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    listPublic().then(setGroups).catch(toastError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      return;
    }

    showPublic(groupId)
      .then(setGroup)
      .catch(err => {
        toastError(err);
        history.push("/helps");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const goToRoot = useCallback(() => history.push("/helps"), [history]);
  const goToGroup = useCallback(id => history.push(`/helps/${id}`), [history]);

  const article =
    group && contentId
      ? group.articles.find(item => String(item.id) === String(contentId))
      : null;

  // Material da plataforma (feito pelo dono da aplicacao) e material da propria
  // empresa vivem em secoes distintas: sao autores e assuntos diferentes.
  const renderCategories = () => {
    const platform = groups.filter(item => item.isGlobal);
    const company = groups.filter(item => !item.isGlobal);

    if (!groups.length) {
      // Deixa o proprio grid dizer que nao ha nada, sem rotular secao vazia.
      return <CategoryGrid groups={groups} onSelect={g => goToGroup(g.id)} />;
    }

    return (
      <>
        {platform.length ? (
          <CategoryGrid
            title={i18n.t("helps.sections.platform")}
            groups={platform}
            onSelect={g => goToGroup(g.id)}
          />
        ) : null}
        {company.length ? (
          <CategoryGrid
            title={i18n.t("helps.sections.company", {
              name:
                user?.company?.name || i18n.t("helps.sections.companyFallback")
            })}
            groups={company}
            onSelect={g => goToGroup(g.id)}
          />
        ) : null}
      </>
    );
  };

  const renderBody = () => {
    if (!groupId) {
      return renderCategories();
    }

    if (!group) {
      return null;
    }

    if (contentId) {
      // Artigo inexistente (ou desativado) volta para o card em vez de
      // renderizar uma tela vazia.
      if (!article) {
        return (
          <CategoryDetail
            group={group}
            onBack={goToRoot}
            onOpenArticle={item =>
              history.push(`/helps/${group.id}/${item.id}`)
            }
          />
        );
      }

      return (
        <ArticleView
          group={group}
          article={article}
          onBack={goToRoot}
          onBackToGroup={() => goToGroup(group.id)}
        />
      );
    }

    return (
      <CategoryDetail
        group={group}
        onBack={goToRoot}
        onOpenArticle={item => history.push(`/helps/${group.id}/${item.id}`)}
      />
    );
  };

  return (
    <MainContainer className="sv-operations sv-screen-helps">
      <MainHeader>
        <StardewEmblem item="book" />
        <Title>{i18n.t("helps.title")}</Title>
        <MainHeaderButtonsWrapper></MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        {renderBody()}
      </Paper>
    </MainContainer>
  );
};

export default Helps;
