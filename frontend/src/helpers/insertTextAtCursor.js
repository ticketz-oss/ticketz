const insertTextAtCursor = (currentValue = "", textToInsert = "", input) => {
  const safeValue = currentValue || "";

  if (
    !input ||
    typeof input.selectionStart !== "number" ||
    typeof input.selectionEnd !== "number"
  ) {
    const nextValue = `${safeValue}${textToInsert}`;

    return {
      nextValue,
      nextSelectionStart: nextValue.length,
      nextSelectionEnd: nextValue.length
    };
  }

  const nextValue = `${safeValue.slice(0, input.selectionStart)}${textToInsert}${safeValue.slice(input.selectionEnd)}`;
  const nextSelectionStart = input.selectionStart + textToInsert.length;

  return {
    nextValue,
    nextSelectionStart,
    nextSelectionEnd: nextSelectionStart
  };
};

export default insertTextAtCursor;