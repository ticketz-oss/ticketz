import { i18n } from "../translate/i18n";

export const getDeleteConfirmationText = (type, name) => {
  const options = {
    type: i18n.t(`common.${type}`),
    name,
    interpolation: { escapeValue: false }
  };

  return {
    title: i18n.t("confirmationModal.deleteRecordTitle", options),
    message: i18n.t("confirmationModal.deleteRecordMessage", options)
  };
};
