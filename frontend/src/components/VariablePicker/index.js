import React, { useState } from "react";

import Button from "@material-ui/core/Button";
import ListSubheader from "@material-ui/core/ListSubheader";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

const VariablePicker = ({
  items,
  onSelectVariable,
  buttonLabel = "{{ }}",
  buttonAriaLabel,
  menuTitle
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = token => {
    onSelectVariable(token);
    handleClose();
  };

  return (
    <>
      <Button
        type="button"
        size="small"
        variant="outlined"
        aria-label={buttonAriaLabel}
        onClick={handleOpen}
      >
        {buttonLabel}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left"
        }}
      >
        {menuTitle ? <ListSubheader disableSticky>{menuTitle}</ListSubheader> : null}
        {items.map(item => (
          <MenuItem key={item.token} onClick={() => handleSelect(item.token)}>
            {item.label || item.token}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default VariablePicker;