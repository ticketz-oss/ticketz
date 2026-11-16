import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfirmationModal from "./index";

jest.mock("../../translate/i18n", () => ({
  i18n: {
    t: (key, values) =>
      key === "confirmationModal.typeToConfirm"
        ? `Type ${values.word} to confirm`
        : key === "confirmationModal.confirmationWord"
          ? "excluir"
          : key === "common.delete"
            ? "Excluir"
            : key
  }
}));

test("requires the exact confirmation text before confirming", () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  const { rerender } = render(
    <ConfirmationModal
      open
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Excluir"
      confirmationText="excluir"
    />
  );

  const confirmButton = screen.getByRole("button", {
    name: "Excluir"
  });
  const confirmationInput = screen.getByRole("textbox");
  const confirmationWord = screen.getByText("EXCLUIR", { selector: "strong" });
  expect(confirmationWord).toBeInTheDocument();
  expect(confirmationWord.parentElement).toHaveTextContent(
    'Type "EXCLUIR" to confirm'
  );

  expect(confirmButton).toBeDisabled();
  expect(confirmButton.style.backgroundSize).toBe("0% 100%");
  fireEvent.change(confirmationInput, { target: { value: "eXc" } });
  expect(confirmButton).toBeDisabled();
  expect(confirmButton.style.backgroundSize).toBe(`${(3 / 7) * 100}% 100%`);
  fireEvent.change(confirmationInput, { target: { value: "eXcL" } });
  expect(confirmButton.style.backgroundSize).toBe(`${(4 / 7) * 100}% 100%`);
  fireEvent.change(confirmationInput, { target: { value: "eX" } });
  expect(confirmButton.style.backgroundSize).toBe(`${(2 / 7) * 100}% 100%`);
  fireEvent.change(confirmationInput, { target: { value: "Exclude" } });
  expect(confirmButton).toBeDisabled();
  expect(confirmButton.style.backgroundSize).toBe("0% 100%");
  fireEvent.click(confirmButton);
  expect(onConfirm).not.toHaveBeenCalled();

  fireEvent.change(confirmationInput, { target: { value: "eXcLuIr" } });
  expect(confirmButton).toBeEnabled();
  expect(confirmButton.style.backgroundSize).toBe("");

  fireEvent.click(confirmButton);

  expect(onClose).toHaveBeenCalledWith(false);
  expect(onConfirm).toHaveBeenCalledWith(false);

  rerender(
    <ConfirmationModal
      open={false}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Excluir"
      confirmationText="excluir"
    />
  );
  rerender(
    <ConfirmationModal
      open
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Excluir"
      confirmationText="excluir"
    />
  );
  expect(confirmationInput).toHaveValue("");
  expect(confirmButton).toBeDisabled();
  expect(confirmButton.style.backgroundSize).toBe("0% 100%");
});

test("accepts the displayed uppercase form of words with expanding characters", () => {
  render(
    <ConfirmationModal
      open
      onClose={jest.fn()}
      onConfirm={jest.fn()}
      confirmationText="ausschließen"
    />
  );
  const input = screen.getByRole("textbox");
  const button = screen.getByRole("button", {
    name: "confirmationModal.buttons.confirm"
  });

  fireEvent.change(input, { target: { value: "AUSSCHLIESS" } });
  expect(button).toBeDisabled();
  expect(button.style.backgroundSize).toBe(`${(11 / 13) * 100}% 100%`);
  fireEvent.change(input, { target: { value: "AUSSCHLIESSEN" } });
  expect(button).toBeEnabled();
});

test("does not add progress to unrelated confirmations", () => {
  render(<ConfirmationModal open onClose={jest.fn()} onConfirm={jest.fn()} />);
  const button = screen.getByRole("button", {
    name: "confirmationModal.buttons.confirm"
  });

  expect(button).toBeEnabled();
  expect(button.style.backgroundSize).toBe("");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
