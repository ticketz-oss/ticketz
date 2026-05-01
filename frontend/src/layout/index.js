import React, { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AccountCircle from "@material-ui/icons/AccountCircle";
import CachedIcon from "@material-ui/icons/Cached";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import { Backendlogs } from "../components/Backendlogs";
import { PhoneCall } from "../components/PhoneCall";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import AboutModal from "../components/AboutModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import DarkMode from "../components/DarkMode";
import { i18n } from "../translate/i18n";
import { messages } from "../translate/languages";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";

import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";
import useAuth from "../hooks/useAuth.js";

import ColorModeContext from "../layout/themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import LanguageIcon from "@material-ui/icons/Language";
import { getBackendURL } from "../services/config";
import NestedMenuItem from "material-ui-nested-menu-item";
import GoogleAnalytics from "../components/GoogleAnalytics";
import OnlyForSuperUser from "../components/OnlyForSuperUser";
import NewTicketModal from "../components/NewTicketModal/index.js";

const drawerWidth = 240;
const DRAWER_STORAGE_KEY = "drawerOpen";

function getStoredDrawerOpen() {
  return localStorage.getItem(DRAWER_STORAGE_KEY) === "true";
}

function persistDrawerOpenState(value) {
  localStorage.setItem(DRAWER_STORAGE_KEY, String(value));
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "var(--vh)",
    backgroundColor: theme.palette.fancyBackground,
    "& .MuiButton-outlinedPrimary": {
      color: theme.palette.primary,
      border:
        theme.mode === "light"
          ? "1px solid rgba(0 124 102)"
          : "1px solid rgba(255, 255, 255, 0.5)",
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary,
    },
  },
  avatar: {
    width: "100%",
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
    color:
      localStorage.getItem("impersonated") === "true"
        ? theme.palette.secondary.contrastText
        : theme.palette.primary.contrastText,
    background:
      localStorage.getItem("impersonated") === "true"
        ? theme.palette.secondary.main
        : theme.palette.primary.main,
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "48px",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(9),
      width: `calc(100% - ${theme.spacing(9)}px)`,
    },
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
    fontSize: 14,
    color: "white",
  },
  userMenuInfoContainer: {
    padding: theme.spacing(1.5, 2),
    maxWidth: 320,
  },
  userMenuInfoLine: {
    fontSize: 13,
    lineHeight: 1.4,
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowY: "clip",
    ...theme.scrollbarStylesSoft,
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "clip",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: {
    minHeight: "48px",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "clip",
    ...theme.scrollbarStyles,
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  },
  logo: {
    maxWidth: "192px",
    maxHeight: "72px",
    logo: theme.logo,
    margin: "auto",
    content: `url("${theme.calculatedLogo()}")`,
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    logo: theme.logo,
    margin: "auto",
    content: `url("${theme.appLogoFavicon ? theme.appLogoFavicon : "/vector/favicon.svg"}")`,
  },
  hideLogo: {
    display: "none",
  },
}));

const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const history = useHistory();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const isDesktop = window.matchMedia("(min-width:600px)").matches;

    if (!isDesktop) {
      return false;
    }

    return getStoredDrawerOpen();
  });
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");
  const { user } = useContext(AuthContext);

  const theme = useTheme();
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { colorMode } = useContext(ColorModeContext);

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

  const { dateToClient } = useDate();

  const socketManager = useContext(SocketContext);

  const [newTicketContact, setNewTicketContact] = useState(null);

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
    getCurrentUserInfo().then((user) => {
      setCurrentUser(user);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentLang = localStorage.getItem("language");
    if (currentLang) {
      setCurrentLanguage(currentLang);
    }
  }, []);

  useEffect(() => {
    window.mentionClick = (mention) => {
      const contact = {
        id: mention.contactId || mention.id,
        name: mention.name,
        number: mention.number,
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
    const companyId = localStorage.getItem("companyId");
    const userId = localStorage.getItem("userId");

    const socket = socketManager.GetSocket(companyId);

    const onCompanyAuthLayout = (data) => {
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
      1000 * 60 * 5,
    );

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [socketManager]);

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleCloseLanguageMenu = () => {
    setAnchorEl(null);
    setLanguageOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseProfileMenu();
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
    setDrawerOpen((prevState) => {
      const nextState = !prevState;
      if (greaterThenSm) {
        persistDrawerOpenState(nextState);
      }
      return nextState;
    });
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  const toggleColorMode = () => {
    colorMode.toggleColorMode();
  };

  const handleChooseLanguage = (language) => {
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
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        onClose={drawerClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose,
          ),
        }}
        open={drawerOpen}
      >
        <div
          className={classes.toolbarIcon}
          onClick={handleDrawerToggle}
          style={{ cursor: "pointer" }}
        >
          <img
            className={
              drawerOpen
                ? classes.logo
                : !isMobile
                  ? classes.logoIcon
                  : classes.hideLogo
            }
            alt="logo"
          />
        </div>
        <Divider />
        <List className={classes.containerWithScroll}>
          <MainListItems
            drawerClose={drawerClose}
            drawerOpen={drawerOpen}
            collapsed={!drawerOpen}
          />
        </List>
        <Divider />
      </Drawer>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AboutModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          />

          <OnlyForSuperUser user={currentUser} yes={() => <Backendlogs />} />

          <PhoneCall />

          <NotificationsVolume setVolume={setVolume} volume={volume} />

          {user.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenu}
              variant="contained"
              style={{ color: "white" }}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseProfileMenu}
            >
              <div className={classes.userMenuInfoContainer}>
                <Typography className={classes.userMenuInfoLine}>
                  {i18n.t("common.name")}:{" "}
                  {user?.name || "-"}
                </Typography>
                <Typography className={classes.userMenuInfoLine}>
                  {i18n.t("common.company")}:{" "}
                  {user?.company?.name || "-"}
                </Typography>
                {shouldShowCompanyDueDate && (
                  <Typography className={classes.userMenuInfoLine}>
                    {i18n.t(
                      "mainDrawer.appBar.user.subscriptionValidUntilLabel",
                    )}
                    : {companyDueDateText}
                  </Typography>
                )}
              </div>
              <Divider />
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={toggleColorMode}>
                {theme.mode === "dark"
                  ? i18n.t("mainDrawer.appBar.user.lightmode")
                  : i18n.t("mainDrawer.appBar.user.darkmode")}
              </MenuItem>
              <NestedMenuItem
                label={i18n.t("mainDrawer.appBar.user.language")}
                parentMenuOpen={menuOpen}
              >
                {Object.keys(messages).map((m) => (
                  <MenuItem onClick={() => handleChooseLanguage(m)}>
                    <div
                      style={{
                        fontWeight: currentLanguage === m ? "bold" : "normal",
                      }}
                    >
                      {messages[m].translations.mainDrawer.appBar.i18n.language}
                    </div>
                  </MenuItem>
                ))}
              </NestedMenuItem>
              <MenuItem onClick={handleOpenAboutModal}>
                {i18n.t("about.aboutthe")}{" "}
                {currentUser?.super ? "ticketz" : theme.appName}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <NewTicketModal
        modalOpen={!!newTicketContact}
        contact={newTicketContact}
        onClose={(ticket) => {
          setNewTicketContact(null);
          if (ticket !== undefined && ticket.uuid !== undefined) {
            history.push(`/tickets/${ticket.uuid}`);
          }
        }}
      />
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <OnlyForSuperUser user={currentUser} yes={() => <GoogleAnalytics />} />
        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;
