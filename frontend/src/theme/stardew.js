import { fonteInterface } from "./identidadeVisual";

// Design primitives adapted from stardewCN (MIT), Kevin Gabeci.
// Keep the application's React 17 controls and their existing behavior.
export const stardew = {
  ink: "#5b341f",
  muted: "#805335",
  border: "#8b451d",
  paper: "#fff1c7",
  inset: "#f5d995",
  green: "#477b38",
  gold: "#f2ba48"
};
const interfaceFont = fonteInterface;
const headingFont = fonteInterface;
export const canUseStardew = (companyId, slug = "") =>
  Number(companyId) === 1 && (!slug || slug === "teste");
export const normalizeTheme = (value, allowed = false) =>
  value === "dark" || value === "light" || (value === "stardew" && allowed)
    ? value
    : "light";

export const applyStardewTheme = (base, enabled) => {
  if (!enabled) return { ...base, isStardew: false, themeName: base.mode };
  const frame = {
    border: `3px solid ${stardew.border}`,
    borderRadius: 0,
    background: "linear-gradient(#fff1c7, #f5e1a4)",
    boxShadow:
      "inset 0 0 0 2px #dda059, inset 0 0 0 4px #fff1c7, 4px 4px 0 #3e1f0840"
  };
  return {
    ...base,
    isStardew: true,
    themeName: "stardew",
    stardew,
    palette: {
      ...base.palette,
      primary: { main: stardew.green, contrastText: "#fff9df" },
      secondary: { main: "#985622", contrastText: "#fff9df" },
      error: { main: "#b52121" },
      warning: { main: "#a66613" },
      success: { main: stardew.green },
      info: { main: "#287698" },
      text: {
        primary: stardew.ink,
        secondary: stardew.muted,
        disabled: "#9b805e"
      },
      divider: "#b88b4a",
      background: { default: "#f5deaa", paper: stardew.paper },
      textPrimary: stardew.ink,
      textCommon: stardew.ink,
      borderPrimary: stardew.border,
      backgroundContrast: {
        default: stardew.inset,
        paper: stardew.inset,
        border: stardew.border
      },
      dark: { main: stardew.ink },
      light: { main: stardew.paper },
      chatBubbleFromMe: { main: "#e1ecaf" },
      chatBubbleReceived: { main: "#fff1c7" },
      chatBackground: { main: "#ecd197" },
      tabHeaderBackground: stardew.inset,
      optionsBackground: stardew.paper,
      options: stardew.paper,
      fontecor: stardew.ink,
      fancyBackground: "#f5deaa",
      bordabox: stardew.border,
      newmessagebox: stardew.inset,
      inputdigita: stardew.paper,
      contactdrawer: stardew.paper,
      announcements: stardew.paper,
      login: stardew.paper,
      announcementspopover: stardew.paper,
      chatlist: { main: stardew.inset },
      boxlist: stardew.inset,
      boxchatlist: stardew.inset,
      total: stardew.paper,
      messageIcons: stardew.muted,
      inputBackground: stardew.paper,
      barraSuperior: stardew.green,
      boxticket: stardew.inset,
      campaigntab: stardew.inset,
      whatsapp: {
        canvas: "#ecd197",
        toolbar: stardew.inset,
        bubble: "#e1ecaf",
        bubbleMuted: stardew.paper,
        ink: stardew.ink,
        copy: stardew.ink,
        muted: stardew.muted,
        line: "#b88b4a",
        hover: "#e8c872",
        badge: "#e1ecaf",
        status: stardew.green,
        switch: stardew.green,
        focus: stardew.border,
        background: "/stardew/farm-tile.svg"
      }
    },
    typography: {
      fontFamily: interfaceFont,
      fontSize: 17,
      fontWeightRegular: 600,
      fontWeightMedium: 600,
      fontWeightBold: 700,
      h4: { fontFamily: headingFont, fontSize: 20, lineHeight: 1.6 },
      h5: { fontFamily: headingFont, fontSize: 16, lineHeight: 1.6 },
      h6: { fontFamily: interfaceFont, fontSize: 24 },
      body1: { fontSize: 20, fontWeight: 600 },
      body2: { fontSize: 18, fontWeight: 600 },
      caption: { fontSize: 16, fontWeight: 600 },
      button: { fontFamily: interfaceFont, fontSize: 19, textTransform: "none" }
    },
    shape: { borderRadius: 0 },
    overrides: {
      ...base.overrides,
      MuiPaper: {
        root: { color: stardew.ink },
        rounded: { borderRadius: 0 },
        elevation1: frame,
        outlined: frame
      },
      MuiButton: {
        root: {
          borderRadius: 0,
          minHeight: 36,
          padding: "6px 14px",
          fontFamily: interfaceFont,
          fontSize: 19
        },
        contained: {
          ...frame,
          background: "#e8c872",
          color: stardew.ink,
          "&:hover": { background: "#f2ba48", boxShadow: "3px 3px 0 #5b3410" }
        },
        containedPrimary: {
          background: stardew.green,
          color: "#fff9df",
          "&:hover": { background: "#345e28" }
        },
        outlined: {
          border: `2px solid ${stardew.border}`,
          background: "#fff1c7"
        }
      },
      MuiIconButton: { root: { borderRadius: 0 } },
      MuiOutlinedInput: {
        root: {
          borderRadius: 0,
          background: "#fff8dd",
          fontFamily: interfaceFont,
          fontSize: 19
        },
        notchedOutline: { borderWidth: 2, borderColor: "#b88b4a" },
        input: { padding: "10px 12px" }
      },
      MuiInputLabel: {
        root: { fontFamily: interfaceFont, fontSize: 15, fontWeight: 600 },
        outlined: {
          whiteSpace: "nowrap",
          maxWidth: "calc(100% - 28px)",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      },
      MuiFormHelperText: { root: { fontFamily: interfaceFont, fontSize: 15 } },
      MuiInputBase: { root: { fontFamily: interfaceFont, fontSize: 19 } },
      MuiTableCell: {
        root: {
          borderBottom: "2px solid #ddb878",
          fontFamily: interfaceFont,
          fontSize: 18,
          padding: "12px 16px"
        },
        head: {
          background: "#e8c872",
          color: stardew.ink,
          fontSize: 19,
          fontWeight: 600
        }
      },
      MuiTab: {
        root: {
          fontFamily: interfaceFont,
          fontSize: 20,
          textTransform: "none",
          minHeight: 40
        }
      },
      MuiTabs: { indicator: { height: 4, backgroundColor: stardew.green } },
      MuiChip: {
        root: {
          borderRadius: 0,
          fontFamily: interfaceFont,
          fontSize: 17,
          fontWeightRegular: 600,
          fontWeightMedium: 600,
          fontWeightBold: 700,
          border: "1px solid #b88b4a"
        }
      },
      MuiDialog: { paper: frame },
      MuiPopover: { paper: frame },
      MuiTooltip: {
        tooltip: {
          ...frame,
          padding: "6px 10px",
          fontFamily: interfaceFont,
          fontSize: 18,
          color: stardew.ink
        }
      },
      MuiDivider: { root: { backgroundColor: "#b88b4a" } },
      MuiMenuItem: {
        root: {
          fontFamily: interfaceFont,
          fontSize: 20,
          "&$selected": { backgroundColor: "#e8c872" }
        }
      },
      MuiListItem: {
        root: { borderRadius: 0, "&$selected": { backgroundColor: "#e8c872" } }
      },
      MuiLinearProgress: {
        root: {
          height: 12,
          border: "2px solid #8b451d",
          background: "#e8c872"
        },
        bar: { background: stardew.green }
      }
    },
    scrollbarStyles: {
      "&::-webkit-scrollbar": { width: 12, height: 12 },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: 0,
        backgroundColor: "#b88b4a",
        border: "2px solid #5b3310"
      }
    },
    scrollbarStylesSoft: {
      "&::-webkit-scrollbar": { width: 10 },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#b88b4a",
        borderRadius: 0
      }
    }
  };
};
