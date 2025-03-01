import { toast as realToast } from 'react-toastify';
import { i18n } from '../translate/i18n';

export const i18nToast = {
  error: (message, options) => {
    return realToast.error(i18n.t(message), options);
  },
  success: (message, options) => {
    return realToast.success(i18n.t(message), options);
  },
  info: (message, options) => {
    return realToast.info(i18n.t(message), options);
  },
  warn: (message, options) => {
    return realToast.warn(i18n.t(message), options);
  }
}
