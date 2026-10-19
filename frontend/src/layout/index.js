import AvatarUsuario from "../components/AvatarUsuario";
import React, { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import {
  makeStyles,
  Drawer,
  Button,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from "@material-ui/core";

import AgentAvailability from "../components/AgentPreview/AgentAvailability";
import WelcomeTour, { useTourNavegacao } from "../components/WelcomeTour";
import SettingsEthernetIcon from "@material-ui/icons/SettingsEthernet";

import MainListItems from "./MainListItems";
import SidebarBrand from "./SidebarBrand";
import FerramentasBarra from "./FerramentasBarra";
import { PanelLeft, Headphones } from "lucide-react";
import "./estrutura.css";
import NotificationsPopOver from "../components/NotificationsPopOver";
import { Backendlogs } from "../components/Backendlogs";
import { PhoneCall } from "../components/PhoneCall";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import AboutModal from "../components/AboutModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import { messages } from "../translate/languages";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";
import SubscriptionNotice from "../components/SubscriptionNotice";

import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";

import ThemeSelector, { ThemeOptions } from "../components/ThemeSelector";
import NestedMenuItem from "material-ui-nested-menu-item";
import GoogleAnalytics from "../components/GoogleAnalytics";
import OnlyForSuperUser from "../components/OnlyForSuperUser";
import NewTicketModal from "../components/NewTicketModal/index.js";

const drawerWidth = 260;
const DRAWER_STORAGE_KEY = "drawerOpen";

function getStoredDrawerOpen() {
  return localStorage.getItem(DRAWER_STORAGE_KEY) !== "false";
}

function persistDrawerOpenState(value) {
  localStorage.setItem(DRAWER_STORAGE_KEY, String(value));
}

const useStyles = makeStyles(theme => ({
  root: {
    "--altura-cabecalho": "70px",
    display: "flex",
    height: "var(--vh)",
    backgroundColor: theme.palette.fancyBackground,
    color: theme.palette.text.primary
  },
  novaConversa: { margin: "4px 12px 8px", minWidth: 36 },
  rodapeUsuario: {
    padding: 12,
    display: "flex",
    gap: 10,
    borderRadius: 0,
    justifyContent: "flex-start",
    textAlign: "left",
    textTransform: "none"
  },
  ferramentasLaterais: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: "8px 6px",
    borderTop: `1px solid ${theme.palette.divider}`,
    "& .MuiIconButton-root": {
      width: 36,
      height: 36,
      padding: 8
    }
  },
  alternarNavegacaoFlutuante: {
    position: "fixed",
    top: 12,
    left: 12,
    zIndex: theme.zIndex.drawer - 1,
    width: 40,
    height: 40,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[2],
    "&:hover": { backgroundColor: theme.palette.background.paper }
  },
  dadosOrganizacao: {
    minWidth: 0,
    flex: 1,
    "& p": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  },
  avatar: {
    width: 30,
    height: 30,
    fontSize: theme.typography.pxToRem(14),
    display: "block",
    boxSizing: "border-box",
    flexShrink: 0
  },
  userInfoWrapper: {
    display: "flex",
    alignItems: "center"
  },
  profileTrigger: {
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    minWidth: 40,
    maxWidth: 160,
    borderRadius: 20,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor:
      theme.mode === "dark"
        ? "rgba(0, 0, 0, 0.2)"
        : "rgba(255, 255, 255, 0.15)",
    [theme.breakpoints.down("xs")]: {
      borderRadius: 20
    }
  },
  profileAvatarSlot: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "0 20px 20px 0"
  },
  userInfoPanel: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      flex: 1,
      minWidth: 0,
      maxWidth: 120,
      flexDirection: "column",
      justifyContent: "center",
      height: 40,
      paddingLeft: 14,
      paddingRight: 8,
      borderRadius: "20px 0 0 20px",
      boxSizing: "border-box",
      overflow: "hidden"
    }
  },
  userInfoName: {
    color: theme.palette.text.primary,
    fontSize: 11,
    lineHeight: "15px",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%"
  },
  userInfoCompany: {
    color: theme.palette.text.primary,
    fontSize: 11,
    lineHeight: "15px",
    opacity: 0.75,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%"
  },
  toolbar: {
    paddingRight: 20,
    minHeight: 60,
    borderBottom: `1px solid ${theme.palette.divider}`,
    color:
      localStorage.getItem("impersonated") === "true"
        ? theme.palette.secondary.contrastText
        : theme.palette.text.primary,
    background:
      localStorage.getItem("impersonated") === "true"
        ? theme.palette.secondary.main
        : theme.palette.background.paper
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "60px"
  },
  appBar: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: "none",
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(9),
      width: `calc(100% - ${theme.spacing(9)}px)`
    }
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  menuButton: {
    marginRight: 16,
    color: theme.palette.text.primary
  },
  menuButtonHidden: {
    display: "none"
  },
  title: {
    flexGrow: 1,
    fontSize: 14,
    color: theme.palette.text.secondary
  },
  wsConnectionAlertButton: {
    marginRight: theme.spacing(1.5),
    color: theme.palette.text.primary,
    padding: theme.spacing(0.5)
  },
  wsConnectionAlertIcon: {
    fontSize: 20
  },
  wsConnectionBadge: {
    "& .MuiBadge-badge": {
      minWidth: 10,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: "#ff4d4f",
      border: "none",
      boxShadow: "none"
    }
  },
  userMenuInfoContainer: {
    padding: theme.spacing(1.5, 2),
    maxWidth: 320
  },
  userMenuInfoLine: {
    fontSize: 13,
    lineHeight: 1.4
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    overflowY: "clip",
    ...theme.scrollbarStylesSoft
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "clip",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9)
    }
  },
  appBarSpacer: {
    minHeight: "60px"
  },
  content: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  pageContent: {
    minHeight: 0,
    flex: 1,
    overflow: "auto"
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "hidden",
    ...theme.scrollbarStyles
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  }
}));

const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const history = useHistory();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading, user } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const isDesktop = window.matchMedia("(min-width:600px)").matches;

    if (!isDesktop) {
      return false;
    }

    return getStoredDrawerOpen();
  });
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");

  const theme = useTheme();
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const canAccessBackendlogs =
    user?.super || localStorage.getItem("impersonated") === "true";

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

  const { dateToClient } = useDate();

  const socketManager = useContext(SocketContext);
  const [wsConnectionIssue, setWsConnectionIssue] = useState(false);

  const [newTicketContact, setNewTicketContact] = useState(null);
  const [novoAtendimentoAberto, definirNovoAtendimentoAberto] = useState(false);

  //################### CODIGOS DE TESTE #########################################
  // useEffect(() => {
  //   navigator.getBattery().then((battery) => {
  //     console.log(`Battery Charging: ${battery.charging}`);
  //     console.log(`Battery Level: ${battery.level * 100}%`);
  //     console.log(`Charging Time: ${battery.chargingTime}`);
  //     console.log(`Discharging Time: ${battery.dischargingTime}`);
  //   })
  // }, []);

  // useEffect(() => {
  //   const geoLocation = navigator.geolocation

  //   geoLocation.getCurrentPosition((position) => {
  //     let lat = position.coords.latitude;
  //     let long = position.coords.longitude;

  //     console.log('latitude: ', lat)
  //     console.log('longitude: ', long)
  //   })
  // }, []);

  // useEffect(() => {
  //   const nucleos = window.navigator.hardwareConcurrency;

  //   console.log('Nucleos: ', nucleos)
  // }, []);

  // useEffect(() => {
  //   console.log('userAgent', navigator.userAgent)
  //   if (
  //     navigator.userAgent.match(/Android/i)
  //     || navigator.userAgent.match(/webOS/i)
  //     || navigator.userAgent.match(/iPhone/i)
  //     || navigator.userAgent.match(/iPad/i)
  //     || navigator.userAgent.match(/iPod/i)
  //     || navigator.userAgent.match(/BlackBerry/i)
  //     || navigator.userAgent.match(/Windows Phone/i)
  //   ) {
  //     console.log('é mobile ', true) //celular
  //   }
  //   else {
  //     console.log('não é mobile: ', false) //nao é celular
  //   }
  // }, []);
  //##############################################################################

  useEffect(() => {
    const currentLang = localStorage.getItem("language");
    if (currentLang) {
      setCurrentLanguage(currentLang);
    }
  }, []);

  useEffect(() => {
    window.mentionClick = mention => {
      const contact = {
        id: mention.contactId || mention.id,
        name: mention.name,
        number: mention.number
      };
      setNewTicketContact(contact);
    };
  }, []);

  useEffect(() => {
    if (greaterThenSm) {
      setDrawerVariant("permanent");
      setDrawerOpen(getStoredDrawerOpen());
      return;
    }

    setDrawerVariant("temporary");
    setDrawerOpen(false);
  }, [greaterThenSm]);

  useEffect(() => {
    if (!greaterThenSm) {
      return;
    }

    persistDrawerOpenState(drawerOpen);
  }, [drawerOpen, greaterThenSm]);

  useEffect(() => {
    if (!socketManager?.subscribeWsConnectionIssue) {
      return undefined;
    }

    return socketManager.subscribeWsConnectionIssue(setWsConnectionIssue);
  }, [socketManager]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const userId = localStorage.getItem("userId");

    const socket = socketManager.GetSocket(companyId);

    const onCompanyAuthLayout = data => {
      const impersonated = localStorage.getItem("impersonated") === "true";
      if (
        !impersonated &&
        !data.user.impersonated &&
        data.user.id === +userId
      ) {
        toastError("Sua conta foi acessada em outro computador.");
        setTimeout(() => {
          localStorage.clear();
          window.location.reload();
        }, 1000);
      }
    };

    socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);

    socket.emit("userStatus");
    const interval = setInterval(
      () => {
        socket.emit("userStatus");
      },
      1000 * 60 * 5
    );

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [socketManager]);

  const handleProfileMenu = event => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseProfileMenu();
  };

  const abrirNavegacao = () => setDrawerOpen(true);
  const refazerTour = useTourNavegacao(abrirNavegacao);
  const handleOpenTour = () => {
    handleCloseProfileMenu();
    refazerTour();
  };

  const handleOpenAboutModal = () => {
    setAboutModalOpen(true);
    handleCloseProfileMenu();
  };

  const handleClickLogout = () => {
    handleCloseProfileMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(prevState => {
      const nextState = !prevState;
      if (greaterThenSm) {
        persistDrawerOpenState(nextState);
      }
      return nextState;
    });
  };

  const handleChooseLanguage = language => {
    localStorage.setItem("language", language);
    window.location.reload(false);
  };

  const userCompanyId = Number(user?.companyId ?? user?.company?.id ?? 0);
  const shouldShowCompanyDueDate =
    user?.profile === "admin" && userCompanyId !== 1;
  const companyDueDateText = user?.company?.dueDate
    ? dateToClient(user.company.dueDate)
    : "-";

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div
      className={`${classes.root} estrutura-app estrutura-app--sem-header`}
      style={{
        "--largura-nav": drawerOpen ? "260px" : "72px",
        "--altura-cabecalho": "0px"
      }}
      data-navegacao={drawerOpen ? "aberta" : "fechada"}
    >
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        onClose={drawerClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose
          )
        }}
        open={drawerOpen}
      >
        <div
          className={classes.toolbarIcon}
          onClick={handleDrawerToggle}
          style={{ cursor: "pointer" }}
        >
          {(drawerOpen || !isMobile) && (
            <SidebarBrand
              expanded={drawerOpen}
              bannerSrc={theme.calculatedLogo()}
              iconSrc={theme.appLogoFavicon}
              name={user?.company?.name || theme.appName}
            />
          )}
        </div>
        <AgentAvailability
          collapsed={!drawerOpen}
          companyId={user?.companyId ?? user?.company?.id}
          companyName={user?.company?.name || theme.appName}
          userName={user?.name || ""}
        />
        <Button
          className={`${classes.novaConversa} nav-abrir-atendimento`}
          color="primary"
          variant="contained"
          aria-label={i18n.t("redesign.abrirAtendimento")}
          onClick={() => definirNovoAtendimentoAberto(true)}
        >
          <Headphones size={17} />
          {drawerOpen && (
            <span style={{ marginLeft: 8 }}>
              {i18n.t("redesign.abrirAtendimento")}
            </span>
          )}
        </Button>
        <List component="nav" className={classes.containerWithScroll}>
          <MainListItems
            drawerClose={drawerClose}
            drawerOpen={drawerOpen}
            collapsed={!drawerOpen}
          />
        </List>
        <Divider />
        <div className={`${classes.ferramentasLaterais} nav-ferramentas`}>
          {wsConnectionIssue && (
            <Tooltip title={i18n.t("common.connection")} arrow>
              <span aria-label={i18n.t("common.connection")}>
                <Badge
                  variant="dot"
                  overlap="circular"
                  color="secondary"
                  className={classes.wsConnectionBadge}
                >
                  <SettingsEthernetIcon
                    className={classes.wsConnectionAlertIcon}
                  />
                </Badge>
              </span>
            </Tooltip>
          )}
          <PhoneCall />
          {user.id && <NotificationsPopOver volume={volume} />}
          <FerramentasBarra>
            {canAccessBackendlogs && <Backendlogs />}
            <NotificationsVolume setVolume={setVolume} volume={volume} />
            <AnnouncementsPopover />
            <ChatPopover />
          </FerramentasBarra>
          <ThemeSelector />
        </div>
        <Button
          className={`${classes.rodapeUsuario} nav-perfil`}
          onClick={handleProfileMenu}
          aria-label={i18n.t("mainDrawer.appBar.user.profile")}
        >
          <AvatarUsuario usuario={user} tamanho={36} />
          {drawerOpen && (
            <div className={classes.dadosOrganizacao}>
              <Typography variant="body2">{user?.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {user?.company?.name || theme.appName}
              </Typography>
            </div>
          )}
        </Button>
      </Drawer>
      {isMobile && !drawerOpen && (
        <IconButton
          className={classes.alternarNavegacaoFlutuante}
          aria-label={i18n.t("visual.alternarNavegacao")}
          onClick={handleDrawerToggle}
        >
          <PanelLeft size={18} />
        </IconButton>
      )}
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AboutModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
      <WelcomeTour user={user} abrirNavegacao={abrirNavegacao} />
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={menuOpen}
        onClose={handleCloseProfileMenu}
      >
        <div className={classes.userMenuInfoContainer}>
          <Typography className={classes.userMenuInfoLine}>
            {i18n.t("common.name")}: {user?.name || "-"}
          </Typography>
          <Typography className={classes.userMenuInfoLine}>
            {i18n.t("common.company")}: {user?.company?.name || "-"}
          </Typography>
          {shouldShowCompanyDueDate && (
            <Typography className={classes.userMenuInfoLine}>
              {i18n.t("mainDrawer.appBar.user.subscriptionValidUntilLabel")}:{" "}
              {companyDueDateText}
            </Typography>
          )}
        </div>
        <Divider />
        <MenuItem onClick={handleOpenUserModal}>
          {i18n.t("mainDrawer.appBar.user.profile")}
        </MenuItem>
        <NestedMenuItem
          label={i18n.t("themes.label")}
          parentMenuOpen={menuOpen}
        >
          <ThemeOptions onSelect={handleCloseProfileMenu} />
        </NestedMenuItem>
        <NestedMenuItem
          label={i18n.t("mainDrawer.appBar.user.language")}
          parentMenuOpen={menuOpen}
        >
          {Object.keys(messages).map(m => (
            <MenuItem key={m} onClick={() => handleChooseLanguage(m)}>
              <div
                style={{
                  fontWeight: currentLanguage === m ? "bold" : "normal"
                }}
              >
                {messages[m].translations.mainDrawer.appBar.i18n.language}
              </div>
            </MenuItem>
          ))}
        </NestedMenuItem>
        <MenuItem onClick={handleOpenTour}>
          {i18n.t("welcomeTour.menu")}
        </MenuItem>
        <MenuItem onClick={handleOpenAboutModal}>
          {i18n.t("about.aboutthe")} {theme.appName || "Espaço Whats"}
        </MenuItem>
        <MenuItem onClick={handleClickLogout}>
          {i18n.t("mainDrawer.appBar.user.logout")}
        </MenuItem>
      </Menu>
      <NewTicketModal
        modalOpen={novoAtendimentoAberto || !!newTicketContact}
        contact={newTicketContact}
        onClose={ticket => {
          setNewTicketContact(null);
          definirNovoAtendimentoAberto(false);
          if (ticket !== undefined && ticket.uuid !== undefined) {
            history.push(`/tickets/${ticket.uuid}`);
          }
        }}
      />
      <main className={classes.content}>
        <OnlyForSuperUser user={user} yes={() => <GoogleAnalytics />} />
        <SubscriptionNotice />
        <div className={classes.pageContent}>{children ? children : null}</div>
      </main>
    </div>
  );
};

export default LoggedInLayout;
