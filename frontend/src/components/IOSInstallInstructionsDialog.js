import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import { Share as ShareIcon, Add as AddIcon } from "@material-ui/icons";
import { i18n } from "../translate/i18n";

const IOSInstallInstructionsDialog = ({ open, onClose }) => {
  const [appName, setAppName] = useState("App");
  const frontendUrl = window.location.origin;

  useEffect(() => {
    // Busca o nome do app do manifest.json (whitelabel)
    fetch('/manifest.json')
      .then(res => res.json())
      .then(data => setAppName(data.short_name || "App"))
      .catch(() => setAppName(document.title.split(' - ')[0] || "App"));
  }, []);

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="ios-pwa-dialog">
      <DialogTitle id="ios-pwa-dialog">
        📱 {i18n.t("pwa.installIosTitle", {
          defaultValue: "Como instalar no iOS",
        })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          {i18n.t("pwa.installIosDescription", {
            defaultValue: `Para adicionar o ${appName} à tela inicial no iPhone ou iPad, siga os passos abaixo:`,
          })}
          <List>
            <ListItem>
              <ListItemIcon>
                <ShareIcon />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("pwa.installIosStep1", {
                  defaultValue: `1. Abra ${frontendUrl} no Safari e toque no ícone de compartilhamento (📤 quadrado com seta para cima).`,
                })}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("pwa.installIosStep2", {
                  defaultValue: `2. Role a lista de opções e selecione "Adicionar à Tela de Início" ➕.`,
                })}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                ✅
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("pwa.installIosStep3", {
                  defaultValue: `3. Ajuste o nome se desejar e toque em "Adicionar" para criar o atalho.`,
                })}
              />
            </ListItem>
          </List>
          {i18n.t("pwa.installIosFooter", {
            defaultValue: `Depois disso o ${appName} ficará disponível como um aplicativo na sua tela inicial! 🎉`,
          })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {i18n.t("common.close", { defaultValue: "Fechar" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IOSInstallInstructionsDialog;
