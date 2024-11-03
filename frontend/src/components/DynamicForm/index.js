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
import { Grid, FormControl, InputLabel, Select, MenuItem, makeStyles, Input, Switch, FormControlLabel } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  maxWidth: {
    width: "100%",
  },
  forceNewLine: {
    flexBasis: "100%",
  },
}));

export const DynamicForm = ({ schema, data, setData, variant }) => {
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
        {schema.map((field, index) => {
          console.log(`field ${index}`, field);
          if (!field) {
            return <div key={index} className={classes.forceNewLine} />;
          }

          return (
            <Grid key={field.name} item lg={field.lgWidth || 4} xs={12}>
              <FormControl className={classes.maxWidth}>
                {field.type === "text" ? (
                  <>
                    <InputLabel htmlFor={field.name}>{field.title}</InputLabel>
                    <Input
                      name={field.name}
                      id={field.name}
                      variant={variant || "standard"}
                      value={data[field.name]}
                      onChange={handleChange}
                    />
                  </>
                ) : field.type === "textarea" ? (
                    <>
                      <InputLabel htmlFor={field.name}>{field.title}</InputLabel>
                      <Input
                        name={field.name}
                        id={field.name}
                        variant={variant || "standard"}
                        value={data[field.name]}
                        onChange={handleChange}
                        multiline
                        rows={4}
                      />
                    </>
                ) : field.type === "select" ? (
                  <>
                    <InputLabel htmlFor={field.name}>{field.title}</InputLabel>
                    <Select
                      name={field.name}
                      id={field.name}
                      variant={variant || "standard"}
                      value={data[field.name] || ""}
                      onChange={handleChange}
                    >
                      {field.options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                ) : field.type === "checkbox" ? (
                  <FormControlLabel
                    control={
                      <Switch
                        name={field.name}
                        id={field.name}
                        checked={!!data[field.name]}
                        onChange={handleChange}
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
