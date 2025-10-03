import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";
import { i18n } from "../translate/i18n";

const IOSInstallInstructionsDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="ios-pwa-dialog">
      <DialogTitle id="ios-pwa-dialog">
        {i18n.t("pwa.installIosTitle", {
          defaultValue: "Como instalar no iOS",
        })}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          {i18n.t("pwa.installIosDescription", {
            defaultValue:
              "Para adicionar o Ticketz à tela inicial no iPhone ou iPad, siga os passos abaixo:",
          })}
          <List>
            <ListItem>
              <ListItemText
                primary={i18n.t("pwa.installIosStep1", {
                  defaultValue:
                    "1. Abra o Ticketz no Safari e toque no ícone de compartilhamento (quadrado com seta para cima).",
                })}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={i18n.t("pwa.installIosStep2", {
                  defaultValue:
                    "2. Role a lista de opções e selecione \"Adicionar à Tela de Início\".",
                })}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={i18n.t("pwa.installIosStep3", {
                  defaultValue:
                    "3. Ajuste o nome se desejar e toque em \"Adicionar\" para criar o atalho.",
                })}
              />
            </ListItem>
          </List>
          {i18n.t("pwa.installIosFooter", {
            defaultValue:
              "Depois disso o Ticketz ficará disponível como um aplicativo na sua tela inicial.",
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
