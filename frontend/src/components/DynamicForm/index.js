/*

This component will receive a form schema and render a form
based on the schema.

The schema will be an array of objects, each object representing
a form field. It is an array on the follwing format:


  {
    name: string;
    title: string;
    description: string;
    lgWidth: number;     // from 1 to 12, default to 4
    type: "text" | "textarea" | "select" | "checkbox";
    options?: { value: string; label: string }[];
    required: boolean;
  }
*/

import React from "react";
import { Grid, FormControl, InputLabel, Select, MenuItem, makeStyles, Input, Switch, FormControlLabel, TextField } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  maxWidth: {
    width: "100%",
  },
  forceNewLine: {
    flexBasis: "100%",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
}));

export const DynamicForm = ({ title, schema, data, setData, onBlur, margin, variant }) => {
  const classes = useStyles();

  // Helper function to handle value changes
  const handleChange = (event) => {
    setData({
      ...data,
      [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    });
  };

  return (
      <Grid container>
        {title && (
          <Grid item xs={12}>
            <h2>{title}</h2>
          </Grid>
        ) }
        {schema.map((field, index) => {
          if (!field) {
            return <div key={index} className={classes.forceNewLine} />;
          }

          return (
            <Grid key={field.name} item
              md={field.mdWidth || field.lgWidth || 4}
              sm={field.smWidth || field.mdWidth || field.lgWidth || 6}
              xs={field.xsWidth || 12}
            >
              <FormControl className={classes.maxWidth}>
                {field.type === "text" ? (
                  <>
                    <TextField
                      name={field.name}
                      label={field.title}
                      id={field.name}
                      variant={variant || "standard"}
                      margin={margin || "dense"}
                      value={data[field.name] || ""}
                      onChange={handleChange}
                      onBlur={onBlur}
                      className={classes.textField}
                    />
                  </>
                ) : field.type === "textarea" ? (
                    <>
                      <TextField
                        name={field.name}
                        label={field.title}
                        id={field.name}
                        variant={variant || "standard"}
                        margin={margin || "dense"}
                        value={data[field.name] || ""}
                        onChange={handleChange}
                        onBlur={onBlur}
                        className={classes.textField}
                        multiline
                        rows={4}
                      />
                    </>
                ) : field.type === "select" ? (
                  <FormControl
                    variant={variant || "standard"}
                    margin={margin || "dense"}
                    className={classes.textField}
                  >
                    <InputLabel id={`select-${field.name}`}>{field.title}</InputLabel>
                    <Select
                      name={field.name}
                      labelId={`select-${field.name}`}
                      label={field.title}
                      value={data[field.name] || ""}
                      onChange={handleChange}
                      onBlur={onBlur}
                    >
                      {field.options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : field.type === "checkbox" ? (
                  <FormControlLabel
                    control={
                      <Switch
                        name={field.name}
                        id={field.name}
                        checked={!!data[field.name]}
                        onChange={handleChange}
                        onBlur={onBlur}
                      />
                    }
                    label={field.title}
                  />
                ) : null}
              </FormControl>
            </Grid>
          );
        })}
      </Grid>
  );
};
