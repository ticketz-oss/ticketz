import React, { useContext, useState } from "react";
import { IconButton, Menu, MenuItem, Tooltip } from "@material-ui/core";
import { Palette, Sun, Moon, Sprout, Check } from "lucide-react";
import ColorModeContext from "../../layout/themeContext";
import { i18n } from "../../translate/i18n";

export const ThemeOptions = ({ onSelect = () => {} }) => {
  const { colorMode } = useContext(ColorModeContext);
  const choices = [
    { value: "light", label: i18n.t("themes.light"), Icon: Sun },
    { value: "dark", label: i18n.t("themes.dark"), Icon: Moon },
    ...(colorMode.stardewAllowed
      ? [{ value: "stardew", label: "Stardew Valley", Icon: Sprout }]
      : [])
  ];
  return choices.map(({ value, label, Icon }) => (
    <MenuItem
      key={value}
      selected={colorMode.themeName === value}
      onClick={() => {
        colorMode.setTheme(value);
        onSelect();
      }}
      aria-label={label}
      role="menuitemradio"
      aria-checked={colorMode.themeName === value}
    >
      {value === "stardew" ? (
        <img
          src="/stardew/logo.png"
          alt="Stardew Valley"
          width={140}
          height={65}
          style={{
            objectFit: "contain",
            imageRendering: "pixelated",
            display: "block"
          }}
        />
      ) : (
        <>
          <Icon size={18} aria-hidden="true" style={{ marginRight: 10 }} />
          {label}
        </>
      )}
      {colorMode.themeName === value && (
        <Check size={16} aria-hidden="true" style={{ marginLeft: 14 }} />
      )}
    </MenuItem>
  ));
};

const ThemeSelector = () => {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Tooltip title={i18n.t("themes.label")}>
        <IconButton
          color="inherit"
          data-tour="theme"
          aria-label={i18n.t("themes.label")}
          aria-haspopup="menu"
          aria-controls={anchor ? "theme-selector" : undefined}
          aria-expanded={Boolean(anchor)}
          onClick={event => setAnchor(event.currentTarget)}
        >
          <Palette size={18} />
        </IconButton>
      </Tooltip>
      <Menu
        id="theme-selector"
        anchorEl={anchor}
        open={Boolean(anchor)}
        getContentAnchorEl={null}
        onClose={() => setAnchor(null)}
      >
        <ThemeOptions onSelect={() => setAnchor(null)} />
      </Menu>
    </>
  );
};
export default ThemeSelector;
