import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TemplateMessageModal from "./index";
import { renderTemplateBody } from "./renderTemplateBody";
import api from "../../services/api";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../services/api", () => ({ post: jest.fn() }));
jest.mock("../../errors/toastError", () => jest.fn());

const template = {
  name: "primeiro_contato",
  language: "pt_BR",
  category: "UTILITY",
  header: null,
  body: "Olá {{1}}, aqui é a {{2}}.",
  footer: null,
  variables: 2
};

const mount = (props = {}) =>
  render(
    <TemplateMessageModal
      open
      onClose={jest.fn()}
      ticketId={7}
      templates={[template]}
      loading={false}
      onSent={jest.fn()}
      {...props}
    />
  );

const openTemplateSelect = () =>
  screen.getByRole("button", { name: /templateMessageModal.fieldLabel/ });

beforeEach(() => jest.clearAllMocks());

describe("renderTemplateBody", () => {
  it("keeps the placeholder while the variable is empty", () => {
    expect(renderTemplateBody(template.body, ["Ana"])).toBe(
      "Olá Ana, aqui é a {{2}}."
    );
  });

  it("applies every filled variable", () => {
    expect(renderTemplateBody(template.body, ["Ana", "AC Norte"])).toBe(
      "Olá Ana, aqui é a AC Norte."
    );
  });
});

describe("TemplateMessageModal", () => {
  it("keeps sending disabled until every variable is filled", async () => {
    mount();

    const send = screen.getByRole("button", {
      name: "templateMessageModal.buttons.ok"
    });
    expect(send).toBeDisabled();

    fireEvent.mouseDown(openTemplateSelect());
    fireEvent.click(await screen.findByText("primeiro_contato"));

    const fields = await screen.findAllByRole("textbox");
    expect(fields).toHaveLength(2);
    expect(send).toBeDisabled();

    fireEvent.change(fields[0], { target: { value: "Ana" } });
    fireEvent.change(fields[1], { target: { value: "AC Norte" } });

    await waitFor(() => expect(send).not.toBeDisabled());
  });

  it("posts the template to the ticket", async () => {
    api.post.mockResolvedValue({});
    const onSent = jest.fn();
    mount({ onSent });

    fireEvent.mouseDown(openTemplateSelect());
    fireEvent.click(await screen.findByText("primeiro_contato"));

    const fields = await screen.findAllByRole("textbox");
    fireEvent.change(fields[0], { target: { value: "Ana" } });
    fireEvent.change(fields[1], { target: { value: "AC Norte" } });

    fireEvent.click(screen.getByText("templateMessageModal.buttons.ok"));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/messages/7/template", {
        name: "primeiro_contato",
        language: "pt_BR",
        parameters: ["Ana", "AC Norte"]
      })
    );
    await waitFor(() => expect(onSent).toHaveBeenCalled());
  });

  it("explains when the WABA has no approved template", () => {
    mount({ templates: [] });

    expect(
      screen.getByText("templateMessageModal.noTemplates")
    ).toBeInTheDocument();
  });
});
