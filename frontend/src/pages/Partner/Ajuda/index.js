import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { makeStyles, Paper } from "@material-ui/core";

import MainContainer from "../../../components/MainContainer";
import MainHeader from "../../../components/MainHeader";
import Title from "../../../components/Title";
import CategoryGrid from "../../../components/HelpCenter/CategoryGrid";
import CategoryDetail from "../../../components/HelpCenter/CategoryDetail";
import ArticleView from "../../../components/HelpCenter/ArticleView";
import partnerApi from "../../../services/partnerApi";
import toastError from "../../../errors/toastError";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    width: "100%",
    minHeight: "200px",
    overflowY: "auto",
    ...theme.scrollbarStyles
  }
}));

const PartnerAjuda = () => {
  const classes = useStyles();
  const history = useHistory();
  const { groupId, contentId } = useParams();

  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    partnerApi
      .get("/partner/helps")
      .then(({ data }) => setGroups(data))
      .catch(toastError);
  }, []);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      return;
    }

    partnerApi
      .get(`/partner/help-groups/${groupId}`)
      .then(({ data }) => setGroup(data))
      .catch(err => {
        toastError(err);
        history.push("/parceiros/ajuda");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const goToRoot = useCallback(
    () => history.push("/parceiros/ajuda"),
    [history]
  );
  const goToGroup = useCallback(
    id => history.push(`/parceiros/ajuda/${id}`),
    [history]
  );

  const article =
    group && contentId
      ? group.articles.find(item => String(item.id) === String(contentId))
      : null;

  const renderBody = () => {
    if (!groupId) {
      return <CategoryGrid groups={groups} onSelect={g => goToGroup(g.id)} />;
    }

    if (!group) {
      return null;
    }

    if (contentId && article) {
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
        onOpenArticle={item =>
          history.push(`/parceiros/ajuda/${group.id}/${item.id}`)
        }
      />
    );
  };

  return (
    <MainContainer className="sd-business sd-partner-help">
      <MainHeader>
        <Title>Ajuda e treinamentos</Title>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        {renderBody()}
      </Paper>
    </MainContainer>
  );
};

export default PartnerAjuda;
