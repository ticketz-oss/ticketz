import React, { useCallback, useEffect, useState } from "react";
import { Paper, Tab, Tabs, makeStyles } from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import useHelpGroups from "../../hooks/useHelpGroups";
import useHelps from "../../hooks/useHelps";
import ContentsTab from "./ContentsTab";
import GroupsTab from "./GroupsTab";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    width: "100%",
    flex: 1,
    padding: theme.spacing(2)
  },
  tabs: {
    marginBottom: theme.spacing(2)
  }
}));

export default function HelpsManager() {
  const classes = useStyles();
  const helpsApi = useHelps();
  const groupsApi = useHelpGroups();

  const [tab, setTab] = useState("contents");
  const [groups, setGroups] = useState([]);
  const [contents, setContents] = useState([]);

  const load = useCallback(async () => {
    try {
      const [groupList, contentList] = await Promise.all([
        groupsApi.list(),
        helpsApi.list()
      ]);
      setGroups(groupList);
      setContents(contentList);
    } catch (err) {
      toastError(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Paper className={classes.mainPaper} elevation={0}>
      <Tabs
        className={classes.tabs}
        value={tab}
        onChange={(event, value) => setTab(value)}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab value="contents" label={i18n.t("helps.tabs.contents")} />
        <Tab value="groups" label={i18n.t("helps.tabs.groups")} />
      </Tabs>

      {tab === "contents" ? (
        <ContentsTab
          groups={groups}
          contents={contents}
          api={helpsApi}
          onChanged={load}
        />
      ) : (
        <GroupsTab groups={groups} api={groupsApi} onChanged={load} />
      )}
    </Paper>
  );
}
