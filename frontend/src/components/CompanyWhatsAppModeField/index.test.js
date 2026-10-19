import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CompanyWhatsAppModeField from "./index";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));

test("offers both providers when creating a company", () => {
  const onChange = jest.fn();
  render(<CompanyWhatsAppModeField value="normal" onChange={onChange} />);
  fireEvent.mouseDown(screen.getByRole("button"));
  fireEvent.click(
    screen.getByRole("option", { name: "companyWhatsAppMode.meta" })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      target: expect.objectContaining({ value: "meta", name: "whatsappMode" })
    }),
    expect.anything()
  );
  expect(screen.getByText("companyWhatsAppMode.immutable")).toBeInTheDocument();
});

test.each(["normal", "meta"])("locks %s on an existing company", value => {
  render(<CompanyWhatsAppModeField value={value} disabled />);
  expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByText(`companyWhatsAppMode.${value}`)).toBeInTheDocument();
});
