import React from "react";
import Typography from "@material-ui/core/Typography";

export default function Title(props) {
  return (
    <Typography variant="h5" color="textPrimary" gutterBottom>
      {props.children}
    </Typography>
  );
}
