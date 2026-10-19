import React from "react";
import { render } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import criarAjustesVisuais from "./overrides";

const renderNarrowSelect = (overrides = criarAjustesVisuais("light")) =>
  render(
    <ThemeProvider theme={createTheme({ overrides })}>
      <div style={{ width: 110 }}>
        <FormControl variant="outlined" margin="dense" fullWidth>
          <InputLabel id="kind-label">Tipo de agendamento</InputLabel>
          <Select
            labelId="kind-label"
            value="ONCE"
            label="Tipo de agendamento"
            onChange={() => {}}
          >
            <MenuItem value="ONCE">Data única</MenuItem>
          </Select>
        </FormControl>
      </div>
    </ThemeProvider>
  );

it("keeps a long floating label on a single line inside narrow fields", () => {
  const { container } = renderNarrowSelect();
  const label = container.querySelector("label");

  expect(label.className).toMatch(/MuiInputLabel-shrink/);
  expect(window.getComputedStyle(label).whiteSpace).toBe("nowrap");
});

it("wraps the same label without the override", () => {
  const { container } = renderNarrowSelect({});
  const label = container.querySelector("label");

  expect(window.getComputedStyle(label).whiteSpace).not.toBe("nowrap");
});
