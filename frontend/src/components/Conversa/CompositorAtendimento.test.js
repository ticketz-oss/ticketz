import React from "react";
import { render, screen } from "@testing-library/react";
import CompositorAtendimento from "./CompositorAtendimento";

jest.mock("../../translate/i18n", () => ({
  i18n: { t: key => key }
}));
jest.mock("../MessageInputCustom", () => props => (
  <div data-compact={String(!!props.compact)} data-testid="message-input" />
));
const renderComposer = () =>
  render(
    <CompositorAtendimento ticket={{ id: 10, isGroup: false, contact: {} }} />
  );

it("usa apenas a caixa compacta e deixa notas no painel lateral", () => {
  const { container } = renderComposer();

  expect(screen.getByTestId("message-input").dataset.compact).toBe("true");
  expect(container.querySelector(".conversa-compositor--compact")).toBeTruthy();
  expect(container.querySelector("[role='tablist']")).toBeNull();
});
