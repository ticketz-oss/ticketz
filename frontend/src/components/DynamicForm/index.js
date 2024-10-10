/*

This component will receive a form schema and render a form
based on the schema.

The schema will be an array of objects, each object representing
a form field. It is an array on the follwing format:


  {
    name: string;
    title: string;
    description: string;
    type: "text" | "textarea" | "select" | "checkbox";
    options?: { value: string; label: string }[];
    required: boolean;
  }
*/

import React from "react";
import { Button, Grid, FormControl, InputLabel, TextField, Checkbox, Select, MenuItem, makeStyles, Input } from "@material-ui/core";

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

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container>
        {schema.map((field, index) => {
          console.log(`field ${index}`, field);
          if (!field) {
            return <div key={index} className={classes.forceNewLine} />;
          }

          return (
            <Grid key={field.name} item lg={4} xs={12}>
              <FormControl className={classes.maxWidth}>
                <InputLabel htmlFor={field.name}>{field.title}</InputLabel>
                {field.type === "text" || field.type === "textarea" ? (
                  <Input
                    name={field.name}
                    id={field.name}
                    variant={variant || "standard"}
                    value={data[field.name]}
                    onChange={handleChange}
                  />
                ) : field.type === "select" ? (
                  <Select
                    name={field.name}
                    id={field.name}
                    variant={variant || "standard"}
                    value={data[field.name]}
                    onChange={handleChange}
                  >
                    {field.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                ) : field.type === "checkbox" ? (
                  <Checkbox
                    name={field.name}
                    id={field.name}
                    checked={data[field.name]}
                    onChange={handleChange}
                  />
                ) : null}
              </FormControl>
            </Grid>
          );
        })}
      </Grid>
    </form>
  );
};
