import NestedMenuItem from "material-ui-nested-menu-item";
import { ThemeOptions } from "../../components/ThemeSelector";
import { i18n } from "../../translate/i18n";
import React, { useContext, useState } from "react";
import clsx from "clsx";
import { useHistory, useLocation } from "react-router-dom";

import {
  AppBar,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery
} from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import AccountCircle from "@material-ui/icons/AccountCircle";
import BusinessIcon from "@material-ui/icons/Business";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import MenuIcon from "@material-ui/icons/Menu";
import MonetizationOnIcon from "@material-ui/icons/MonetizationOn";
import SettingsIcon from "@material-ui/icons/Settings";

import BackdropLoading from "../../components/BackdropLoading";
import { PartnerAuthContext } from "../../context/PartnerAuth/PartnerAuthContext";

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    height: "var(--vh)",
    backgroundColor: theme.palette.fancyBackground
  },
  toolbar: {
    paddingRight: 24,
    color: theme.palette.primary.contrastText,
    background: theme.palette.primary.main
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "48px"
  },
  appBar: {
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
    marginRight: 36,
    color: theme.palette.primary.contrastText
  },
  title: {
    flexGrow: 1,
    fontSize: 14,
    color: "white"
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
    minHeight: "48px"
  },
  content: {
    flex: 1,
    overflow: "auto"
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "hidden",
    ...theme.scrollbarStyles
  },
  logo: {
    maxWidth: "192px",
    maxHeight: "72px",
    margin: "auto",
    content: `url("${theme.calculatedLogo()}")`
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    margin: "auto",
    content: `url("${theme.appLogoFavicon ? theme.appLogoFavicon : "/branding/icon.png"}")`
  },
  hideLogo: {
    display: "none"
  },
  partnerInfoPanel: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: 40,
      paddingRight: 8,
      maxWidth: 160,
      overflow: "hidden"
    }
  },
  partnerInfoName: {
    color: theme.palette.primary.contrastText,
    fontSize: 11,
    lineHeight: "15px",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  partnerInfoRole: {
    color: theme.palette.primary.contrastText,
    fontSize: 11,
    lineHeight: "15px",
    opacity: 0.75
  },
  profileTrigger: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  }
}));

const menuItems = [
  { path: "/parceiros/clientes", label: "Clientes", icon: <BusinessIcon /> },
  {
    path: "/parceiros/financeiro",
    label: "Financeiro",
    icon: <MonetizationOnIcon />
  },
  { path: "/parceiros/ajuda", label: "Ajuda", icon: <HelpOutlineIcon /> },
  {
    path: "/parceiros/configuracoes",
    label: "Configurações",
    icon: <SettingsIcon />
  }
];

const PartnerLayout = ({ children }) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const { partner, loading, handleLogout } = useContext(PartnerAuthContext);

  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [drawerOpen, setDrawerOpen] = useState(greaterThenSm);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => setDrawerOpen(prev => !prev);

  const handleNavigate = path => {
    history.push(path);
    if (window.innerWidth <= 600) {
      setDrawerOpen(false);
    }
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      <Drawer
        variant={greaterThenSm ? "permanent" : "temporary"}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        onClose={() => setDrawerOpen(false)}
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
          {menuItems.map(item => (
            <ListItem
              button
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
      </Drawer>
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
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
          >
            Portal de Parceiros
          </Typography>
          <div
            className={classes.profileTrigger}
            onClick={event => setAnchorEl(event.currentTarget)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setAnchorEl(event.currentTarget);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className={classes.partnerInfoPanel}>
              <Typography noWrap className={classes.partnerInfoName}>
                {partner?.name || "-"}
              </Typography>
              <Typography noWrap className={classes.partnerInfoRole}>
                Parceiro
              </Typography>
            </div>
            <AccountCircle
              style={{ color: theme.palette.primary.contrastText }}
            />
          </div>
          <Menu
            anchorEl={anchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <NestedMenuItem
              label={i18n.t("themes.label")}
              parentMenuOpen={Boolean(anchorEl)}
            >
              <ThemeOptions onSelect={() => setAnchorEl(null)} />
            </NestedMenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                handleLogout();
              }}
            >
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {children}
      </main>
    </div>
  );
};

export default PartnerLayout;
