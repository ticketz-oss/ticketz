import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  makeStyles
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";

import { i18n } from "../../translate/i18n";
import { iconNames, getIconComponent } from "./icons";

const useStyles = makeStyles(theme => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2)
  },
  option: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius
  },
  selected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected
  }
}));

const IconPicker = ({ open, currentIcon, onChange, onClose }) => {
  const classes = useStyles();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return iconNames;
    return iconNames.filter(name => name.toLowerCase().includes(term));
  }, [search]);

  const handleSelect = name => {
    onChange(name);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("helps.iconPicker.title")}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          variant="outlined"
          margin="dense"
          placeholder={i18n.t("helps.iconPicker.search")}
          value={search}
          onChange={event => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Box className={classes.grid}>
          {filtered.map(name => {
            const Icon = getIconComponent(name);
            return (
              <Tooltip key={name} title={name}>
                <IconButton
                  className={`${classes.option} ${
                    name === currentIcon ? classes.selected : ""
                  }`}
                  onClick={() => handleSelect(name)}
                >
                  <Icon />
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          {i18n.t("helps.buttons.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IconPicker;
