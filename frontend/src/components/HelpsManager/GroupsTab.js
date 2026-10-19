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
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import EditIcon from "@material-ui/icons/Edit";

import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { i18nToast } from "../../helpers/i18nToast";
import useSortableList from "../../hooks/useSortableList";
import ConfirmationModal from "../ConfirmationModal";
import { getIconComponent } from "../IconPicker/icons";
import HelpGroupModal from "./HelpGroupModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import { bucketKey, bucketsOf } from "./scope";

const useStyles = makeStyles(theme => ({
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2)
  },
  audienceBlock: {
    marginBottom: theme.spacing(3)
  },
  audienceTitle: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1)
  },
  handle: {
    cursor: "grab",
    color: theme.palette.text.secondary,
    display: "flex"
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.borderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main
  },
  info: {
    flexGrow: 1,
    minWidth: 0
  },
  subtitle: {
    color: theme.palette.text.secondary
  },
  empty: {
    color: theme.palette.text.secondary
  }
}));

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Uma secao por balde (publico + escopo). O balde da plataforma aparece para o
 * admin da empresa, mas somente leitura: sem alca de arrastar e sem acoes.
 */
const BucketList = ({ bucket, onEdit, onDelete, onReorder }) => {
  const classes = useStyles();
  const { groups, manageable } = bucket;

  const handleMove = (from, to) =>
    onReorder(bucket.key, move(groups, from, to));

  const listRef = useSortableList(handleMove, manageable && groups.length > 1);

  return (
    <Box className={classes.audienceBlock}>
      <Typography variant="subtitle2" className={classes.audienceTitle}>
        {bucket.label}
      </Typography>

      <div ref={listRef}>
        {groups.map(group => {
          const Icon = getIconComponent(group.icon);

          return (
            <Paper
              key={group.id}
              className={classes.card}
              variant="outlined"
              data-sortable-item
            >
              {manageable ? (
                <span className={classes.handle} data-drag-handle>
                  <DragIndicatorIcon />
                </span>
              ) : null}
              <Box className={classes.iconBox}>
                <Icon />
              </Box>
              <Box className={classes.info}>
                <Typography variant="subtitle1">{group.title}</Typography>
                {group.subtitle ? (
                  <Typography variant="body2" className={classes.subtitle}>
                    {group.subtitle}
                  </Typography>
                ) : null}
              </Box>
              {!group.isActive ? (
                <Chip size="small" label={i18n.t("helps.inactive")} />
              ) : null}
              {group.adminOnly ? (
                <Chip
                  size="small"
                  color="primary"
                  label={i18n.t("helps.adminOnly")}
                />
              ) : null}
              {manageable ? (
                <>
                  <IconButton onClick={() => onEdit(group)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(group)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </>
              ) : null}
            </Paper>
          );
        })}
      </div>
    </Box>
  );
};

const GroupsTab = ({ groups, api, onChanged }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [items, setItems] = useState(groups);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    setItems(groups);
  }, [groups]);

  // Atualização otimista: o card já aparece na posição nova e volta sozinho se
  // o servidor recusar.
  const handleReorder = async (key, reordered) => {
    const previous = items;
    // Compara pelo balde inteiro, nao so pelo publico: senao a secao da empresa
    // e a da plataforma (mesmo publico "company") embaralhariam uma a outra.
    const others = items.filter(group => bucketKey(group) !== key);

    setItems([...others, ...reordered]);

    try {
      await api.reorder(
        reordered.map((group, index) => ({ id: group.id, order: index }))
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

  return (
    <Box>
      <Box className={classes.header}>
        <Typography variant="subtitle1">
          {i18n.t("helps.tabs.groups")}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {i18n.t("helps.buttons.addGroup")}
        </Button>
      </Box>

      {items.length ? (
        bucketsOf(items, user).map(bucket => (
          <BucketList
            key={bucket.key}
            bucket={bucket}
            onEdit={group => {
              setEditing(group);
              setModalOpen(true);
            }}
            onDelete={setDeleting}
            onReorder={handleReorder}
          />
        ))
      ) : (
        <Typography variant="body2" className={classes.empty}>
          {i18n.t("helps.noGroups")}
        </Typography>
      )}

      <HelpGroupModal
        open={modalOpen}
        group={editing}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmationModal
        title={i18n.t("helps.confirmDeleteGroup.title")}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      >
        {i18n.t("helps.confirmDeleteGroup.message")}
      </ConfirmationModal>
    </Box>
  );
};

export default GroupsTab;
