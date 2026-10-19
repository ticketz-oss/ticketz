import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Typography,
  makeStyles
} from "@material-ui/core";
import ArticleIcon from "@material-ui/icons/Description";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import EditIcon from "@material-ui/icons/Edit";
import VideoIcon from "@material-ui/icons/PlayCircleOutline";

import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { i18nToast } from "../../helpers/i18nToast";
import useSortableList from "../../hooks/useSortableList";
import ConfirmationModal from "../ConfirmationModal";
import { getIconComponent } from "../IconPicker/icons";
import HelpContentModal from "./HelpContentModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import { bucketLabel, canManageGroup } from "./scope";

const useStyles = makeStyles(theme => ({
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2)
  },
  groupBlock: {
    marginBottom: theme.spacing(3)
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(1, 1.5),
    marginBottom: theme.spacing(0.5)
  },
  handle: {
    cursor: "grab",
    color: theme.palette.text.secondary,
    display: "flex"
  },
  typeIcon: {
    color: theme.palette.text.secondary,
    display: "flex"
  },
  info: {
    flexGrow: 1,
    minWidth: 0
  },
  muted: {
    color: theme.palette.text.secondary
  }
}));

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const GroupBlock = ({
  group,
  contents,
  manageable,
  onAdd,
  onEdit,
  onDelete,
  onReorder
}) => {
  const classes = useStyles();
  const GroupIcon = getIconComponent(group.icon);

  const handleMove = (from, to) =>
    onReorder(group.id, move(contents, from, to));

  const listRef = useSortableList(
    handleMove,
    manageable && contents.length > 1
  );

  return (
    <Box className={classes.groupBlock}>
      <Box className={classes.groupHeader}>
        <GroupIcon fontSize="small" />
        <Typography variant="subtitle1">{group.title}</Typography>
        <Chip size="small" label={bucketLabel(group)} />
        <Box flexGrow={1} />
        {manageable ? (
          <Button size="small" color="primary" onClick={() => onAdd(group)}>
            {i18n.t("helps.buttons.addContent")}
          </Button>
        ) : null}
      </Box>

      {contents.length ? (
        <div ref={listRef}>
          {contents.map(content => (
            <Paper
              key={content.id}
              className={classes.row}
              variant="outlined"
              data-sortable-item
            >
              {manageable ? (
                <span className={classes.handle} data-drag-handle>
                  <DragIndicatorIcon />
                </span>
              ) : null}
              <span
                className={classes.typeIcon}
                title={i18n.t(`helps.contentType.${content.type}`)}
              >
                {content.type === "article" ? (
                  <ArticleIcon fontSize="small" />
                ) : (
                  <VideoIcon fontSize="small" />
                )}
              </span>
              <Box className={classes.info}>
                <Typography variant="body1">{content.title}</Typography>
                {content.description ? (
                  <Typography variant="body2" className={classes.muted}>
                    {content.description}
                  </Typography>
                ) : null}
              </Box>
              {!content.isActive ? (
                <Chip size="small" label={i18n.t("helps.inactive")} />
              ) : null}
              {content.adminOnly ? (
                <Chip
                  size="small"
                  color="primary"
                  label={i18n.t("helps.adminOnly")}
                />
              ) : null}
              {manageable ? (
                <>
                  <IconButton onClick={() => onEdit(content)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(content)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </>
              ) : null}
            </Paper>
          ))}
        </div>
      ) : (
        <Typography variant="body2" className={classes.muted}>
          {i18n.t("helps.emptyGroup")}
        </Typography>
      )}
    </Box>
  );
};

const ContentsTab = ({ groups, contents, api, onChanged }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  // Cards da plataforma aparecem listados (o admin precisa saber o que os
  // colaboradores dele ja veem), mas sem acoes de escrita.
  const manageableGroups = groups.filter(group => canManageGroup(group, user));

  const [items, setItems] = useState(contents);
  const [editing, setEditing] = useState(null);
  const [defaultGroupId, setDefaultGroupId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    setItems(contents);
  }, [contents]);

  // Atualização otimista: a linha já sobe/desce e volta sozinha se o servidor
  // recusar.
  const handleReorder = async (groupId, reordered) => {
    const previous = items;
    const others = items.filter(content => content.groupId !== groupId);

    setItems([...others, ...reordered]);

    try {
      await api.reorder(
        reordered.map((content, index) => ({ id: content.id, order: index }))
      );
      await onChanged();
    } catch (err) {
      setItems(previous);
      toastError(err);
    }
  };

  const handleSave = async values => {
    try {
      if (values.id) {
        await api.update(values);
      } else {
        await api.save(values);
      }
      await onChanged();
      setModalOpen(false);
      setEditing(null);
      i18nToast.success("helps.toasts.saved");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.remove(deleting.id);
      await onChanged();
      i18nToast.success("helps.toasts.deleted");
    } catch (err) {
      toastError(err);
    }
    setDeleting(null);
  };

  const openModal = (content, groupId) => {
    setEditing(content);
    setDefaultGroupId(groupId || "");
    setModalOpen(true);
  };

  if (!groups.length) {
    return (
      <Typography variant="body2" className={classes.muted}>
        {i18n.t("helps.noGroups")}
      </Typography>
    );
  }

  return (
    <Box>
      <Box className={classes.header}>
        <Typography variant="subtitle1">
          {i18n.t("helps.tabs.contents")}
        </Typography>
        {manageableGroups.length ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => openModal(null, manageableGroups[0].id)}
          >
            {i18n.t("helps.buttons.addContent")}
          </Button>
        ) : null}
      </Box>

      {groups.map(group => (
        <GroupBlock
          key={group.id}
          group={group}
          manageable={canManageGroup(group, user)}
          contents={items
            .filter(content => content.groupId === group.id)
            .sort((a, b) => a.order - b.order)}
          onAdd={() => openModal(null, group.id)}
          onEdit={content => openModal(content, content.groupId)}
          onDelete={setDeleting}
          onReorder={handleReorder}
        />
      ))}

      <HelpContentModal
        open={modalOpen}
        content={editing}
        groups={manageableGroups}
        defaultGroupId={defaultGroupId}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmationModal
        title={i18n.t("helps.confirmDeleteContent.title")}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      >
        {i18n.t("helps.confirmDeleteContent.message")}
      </ConfirmationModal>
    </Box>
  );
};

export default ContentsTab;
