import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField
} from "@material-ui/core";
import { toast } from "react-toastify";
import { UsersFilter } from "../../components/UsersFilter";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

export default function ChatModal({
  open,
  chat,
  type,
  handleClose,
  handleLoadNewChat,
  user
}) {
  const [salvando, definirSalvando] = useState(false);
  const conversaInicial = useRef(chat);
  conversaInicial.current = chat;
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const chat = conversaInicial.current;
    setTitle("");
    setUsers([]);
    if (type === "edit" && chat?.users) {
      const userList = chat.users
        .filter(u => u.userId !== user.id)
        .map(u => ({
          id: u.userId,
          name: u.user?.name || ""
        }));
      setUsers(userList);
      setTitle(chat.title);
    }
  }, [chat?.id, open, type, user.id]);

  const handleSave = async () => {
    if (salvando) return;
    definirSalvando(true);
    try {
      if (!title.trim()) {
        toast.error(i18n.t("conversa.tituloObrigatorio"));
        return;
      }

      if (!users || users.length === 0) {
        toast.error(i18n.t("conversa.participanteObrigatorio"));
        return;
      }

      if (type === "edit") {
        await api.put(`/chats/${chat.id}`, {
          users,
          title
        });
      } else {
        const { data } = await api.post("/chats", {
          users,
          title
        });
        handleLoadNewChat(data);
      }
      handleClose();
    } catch (err) {
      toastError(err);
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Dialog
      className="chat-dialogo"
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
    >
      <DialogTitle id="alert-dialog-title">
        {i18n.t("conversa.conversa")}
      </DialogTitle>
      <DialogContent>
        <Grid spacing={2} container>
          <Grid xs={12} style={{ padding: 18 }} item>
            <TextField
              label={i18n.t("conversa.titulo")}
              placeholder={i18n.t("conversa.titulo")}
              value={title}
              onChange={e => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid xs={12} item>
            <UsersFilter
              multiple
              onFiltered={users => setUsers(users)}
              initialUsers={users}
              excludeId={user.id}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={salvando} color="primary">
          {i18n.t("fluxos.fechar")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={salvando}
          color="primary"
          variant="contained"
        >
          {i18n.t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
