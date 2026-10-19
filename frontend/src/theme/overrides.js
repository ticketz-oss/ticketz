import { coresInterface } from "./identidadeVisual";

const criarAjustesVisuais = modo => {
  const cores = coresInterface(modo);
  return {
    MuiInputLabel: { outlined: { "&$shrink": { whiteSpace: "nowrap" } } },
    MuiButton: {
      root: { borderRadius: 8, minHeight: 36, padding: "7px 14px" },
      contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
      outlined: { borderColor: cores.borda }
    },
    MuiPaper: {
      rounded: { borderRadius: 12 },
      elevation1: { boxShadow: "none", border: `1px solid ${cores.borda}` },
      outlined: { borderColor: cores.borda }
    },
    MuiOutlinedInput: {
      root: { borderRadius: 8, backgroundColor: cores.superficie },
      notchedOutline: { borderColor: cores.borda },
      input: { padding: "12px 14px" },
      inputMarginDense: { paddingTop: 10, paddingBottom: 10 }
    },
    MuiTableCell: {
      root: {
        borderBottom: `1px solid ${cores.borda}`,
        padding: "14px 16px",
        fontSize: 13
      },
      head: {
        backgroundColor: cores.suave,
        color: cores.secundario,
        fontWeight: 600,
        fontSize: 12
      }
    },
    MuiTab: {
      root: {
        textTransform: "none",
        minHeight: 40,
        fontSize: 13,
        fontWeight: 500
      }
    },
    MuiTabs: { root: { minHeight: 40 } },
    MuiChip: { root: { borderRadius: 6, fontSize: 12 } },
    MuiDialog: { paper: { borderRadius: 16 } },
    MuiTooltip: { tooltip: { borderRadius: 6, fontSize: 12 } },
    MuiDivider: { root: { backgroundColor: cores.borda } }
  };
};

export default criarAjustesVisuais;
