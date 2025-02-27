import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { IconButton, Tooltip } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  iconSwitch: {
    color: (props) => (props.value ? theme.palette.primary.main : "gray"),
    width: 48,
    height: 48,
  },
}));

const IconSwitch = (props) => {
  const { setter, value, icon, tooltip } = props;
  const classes = useStyles({ value });

  return (
    <Tooltip title={tooltip}>
      <IconButton
        onClick={() => setter(!value)}
        className={classes.iconSwitch}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export default IconSwitch;
