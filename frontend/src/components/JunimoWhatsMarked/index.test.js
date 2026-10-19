/* eslint-disable testing-library/no-node-access, testing-library/no-container -- Verify formatting tags and copied text, not only visible labels. */
import React from "react";
import { render, within } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import WhatsMarked from "react-whatsmarked";
import JunimoWhatsMarked from ".";

const renderMessage = (text, stardew = false, Component = JunimoWhatsMarked) =>
  render(
    <ThemeProvider theme={createTheme({ isStardew: stardew })}>
      <Component>{text}</Component>
    </ThemeProvider>
  );

it("keeps standard themes identical to the original formatter without Junimo annotations", () => {
  const text = "*Oi!* _Tudo bem?_ 😊 https://example.com\nNova linha";
  const { container: normal } = renderMessage(text);
  const { container: formatted } = renderMessage(text, false, WhatsMarked);
  expect(normal.innerHTML).toBe(formatted.innerHTML);
  expect(normal.querySelector(".sd-junimo-text")).toBeNull();
});

it("preserves formatted tags, links, emoji and copied text while annotating only visible message letters", () => {
  const text =
    "*Olá!* _Tudo bem?_ ~riscado~ 😊 https://example.com\nSegunda linha";
  const { container: original } = renderMessage(text, false, WhatsMarked);
  const { container: junimo } = renderMessage(text, true);
  const originalLink = original.querySelector("a");
  const junimoLink = junimo.querySelector("a");

  expect(junimo.textContent).toBe(original.textContent);
  expect(junimoLink.getAttribute("href")).toBe(
    originalLink.getAttribute("href")
  );
  expect(
    within(junimo).getByRole("link", { name: "https://example.com" })
  ).toBe(junimoLink);
  expect(junimoLink.getAttribute("target")).toBe("_blank");
  expect(junimoLink.getAttribute("rel")).toBe("noopener noreferrer");
  for (const tag of ["strong", "em", "del", "br"])
    expect(junimo.querySelectorAll(tag)).toHaveLength(
      original.querySelectorAll(tag).length
    );
  expect(junimo.querySelectorAll(".sd-junimo-symbol").length).toBeGreaterThan(
    20
  );
  expect(
    junimo.querySelector('.sd-junimo-symbol[data-junimo="O"]')
  ).toBeTruthy();
  expect(junimo.textContent).toContain("😊");
  for (const symbol of junimo.querySelectorAll(".sd-junimo-symbol"))
    expect(symbol.textContent).toBe("");
  expect(
    junimo.querySelector('.sd-junimo-text[aria-label="Olá!"]')
  ).toBeTruthy();
});

it("keeps long unbroken links breakable without changing their destination or text", () => {
  const text = `https://example.com/${"a".repeat(90)}`;
  const { container } = renderMessage(text, true);
  expect(container.querySelector("a").getAttribute("href")).toBe(text);
  expect(container.textContent.trim()).toBe(text);
  expect(container.querySelector(".sd-junimo-word--long")).toBeTruthy();
});

it("removes annotations when the active theme changes and leaves the original content unchanged", () => {
  const text = "Olá, teste!";
  const { container, rerender } = renderMessage(text, true);
  expect(container.querySelector(".sd-junimo-text")).toBeTruthy();
  const originalText = container.textContent;
  rerender(
    <ThemeProvider theme={createTheme({ isStardew: false })}>
      <JunimoWhatsMarked>{text}</JunimoWhatsMarked>
    </ThemeProvider>
  );
  expect(container.querySelector(".sd-junimo-text")).toBeNull();
  expect(container.textContent).toBe(originalText);
});

it("preserves an ordered message list that starts at 3", () => {
  const text = "3. primeira\n4. segunda";
  const { container } = renderMessage(text, true);
  const list = within(container).getByRole("list");
  expect(list.getAttribute("start")).toBe("3");
  expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  expect(list.textContent).toContain("primeira");
  expect(list.textContent).toContain("segunda");
});

it("exposes Latin words and spaces to assistive technology while hiding only decorative symbols", () => {
  const { container } = renderMessage("Olá 😊 mundo!", true);
  const words = container.querySelectorAll(".sd-junimo-word");
  const spaces = container.querySelectorAll(".sd-junimo-space");
  const symbols = container.querySelectorAll(".sd-junimo-symbol");
  expect(Array.from(words).filter(word => word.textContent)).toHaveLength(3);
  expect(spaces.length).toBeGreaterThanOrEqual(2);
  expect(symbols.length).toBeGreaterThan(5);
  for (const latin of [...words, ...spaces])
    expect(latin.getAttribute("aria-hidden")).not.toBe("true");
  for (const symbol of symbols)
    expect(symbol.getAttribute("aria-hidden")).toBe("true");
  expect(container.textContent).toContain("Olá 😊 mundo!");
});

it("keeps formatter whitespace between blocks raw so native copy adds no extra line break", () => {
  const text = "Olá mundo!";
  const { container: original } = renderMessage(text, false, WhatsMarked);
  const { container } = renderMessage(text, true);
  const originalWhitespace = original.querySelector(".whatsmarked").lastChild;
  const annotatedWhitespace = container.querySelector(".whatsmarked").lastChild;
  expect(originalWhitespace.nodeType).toBe(Node.TEXT_NODE);
  expect(annotatedWhitespace.nodeType).toBe(Node.TEXT_NODE);
  expect(annotatedWhitespace.textContent).toBe(originalWhitespace.textContent);
  expect(
    Array.from(container.querySelectorAll(".sd-junimo-text")).some(node =>
      /^\s*$/.test(node.textContent)
    )
  ).toBe(false);
  expect(container.textContent).toBe(original.textContent);
});
