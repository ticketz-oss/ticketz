import React from "react";
import { MemoryRouter } from "react-router-dom";
import { Drawer, Button, Typography, Paper, List } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import { Headphones } from "lucide-react";
import ChatOutlinedIcon from "@material-ui/icons/ChatOutlined";
import PeopleOutlineIcon from "@material-ui/icons/PeopleOutline";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import Navegacao from "../../layout/Navegacao";
import SidebarBrand from "../../layout/SidebarBrand";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import { publicBrandAsset } from "../../components/LoginExperience/BrandPanel";
import { i18n } from "../../translate/i18n";
import "../../layout/estrutura.css";

export default function SystemPreview({ settings, expanded }) {
  const theme = useTheme();
  const groups = [
    {
      chave: "redesign.operacao",
      itens: [
        {
          to: "/tickets",
          chave: "mainDrawer.listItems.tickets",
          icone: <ChatOutlinedIcon />
        },
        {
          to: "/contacts",
          chave: "mainDrawer.listItems.contacts",
          icone: <PeopleOutlineIcon />
        }
      ]
    },
    {
      chave: "redesign.administracao",
      itens: [
        {
          to: "/connections",
          chave: "mainDrawer.listItems.connections",
          icone: <SyncAltIcon />
        },
        {
          to: "/settings",
          chave: "mainDrawer.listItems.settings",
          icone: <SettingsOutlinedIcon />
        }
      ]
    }
  ];
  return (
    <MemoryRouter initialEntries={["/tickets"]}>
      <div
        className="estrutura-app estrutura-app--sem-header brand-system-preview"
        data-navegacao={expanded ? "aberta" : "fechada"}
        style={{
          "--largura-nav": expanded ? "260px" : "72px",
          "--altura-cabecalho": "0px",
          "--fundo-app": theme.palette.background.default
        }}
      >
        <Drawer
          variant="permanent"
          PaperProps={{
            style: { position: "relative", height: "100%", overflowX: "hidden" }
          }}
        >
          <div className="brand-system-logo">
            <SidebarBrand
              expanded={expanded}
              bannerSrc={publicBrandAsset(settings.appLogoLight)}
              iconSrc={publicBrandAsset(settings.appLogoFavicon)}
              name={settings.appName}
            />
          </div>
          <Button
            className="nav-abrir-atendimento"
            variant="contained"
            color="primary"
            aria-label={i18n.t("redesign.abrirAtendimento")}
          >
            <Headphones size={17} />
            {expanded && <span>{i18n.t("redesign.abrirAtendimento")}</span>}
          </Button>
          <List component="nav" className="brand-system-navigation">
            <Navegacao
              grupos={groups}
              expandido={expanded}
              aoNavegar={() => {}}
            />
          </List>
        </Drawer>
        <main>
          <MainContainer>
            <MainHeader>
              <Typography variant="h6">
                {i18n.t("mainDrawer.listItems.tickets")}
              </Typography>
            </MainHeader>
            <Paper elevation={0} className="brand-system-workspace">
              <Typography color="textSecondary">
                {i18n.t("landing.motion.checkout.identity.systemCaption")}
              </Typography>
            </Paper>
          </MainContainer>
        </main>
      </div>
    </MemoryRouter>
  );
}
