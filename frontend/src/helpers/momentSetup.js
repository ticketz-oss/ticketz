import moment from 'moment';

async function startMoment() {
  window.ticketz = { moment };

  // Get preferred language from localStorage or browser
  const storedLanguage = localStorage.getItem('language');
  const browserLanguage = navigator.language || navigator.userLanguage;

  console.debug(`Stored Language: ${storedLanguage}`);
  console.debug(`Browser Language: ${browserLanguage}`);

  // Extract the primary language code (first two letters)
  const storedLangCode = storedLanguage ? storedLanguage.split('-')[0] : '';
  const browserLangCode = browserLanguage.split('-')[0];

  console.debug(`Stored Language Code: ${storedLangCode}`);
  console.debug(`Browser Language Code: ${browserLangCode}`);

  // Determine the more specific locale to use
  const localeToUse = (storedLanguage && storedLangCode === browserLangCode)
    ? (storedLanguage.length > browserLanguage.length ? storedLanguage : browserLanguage)
    : (storedLanguage || browserLanguage);

  console.debug(`Locale to use: ${localeToUse}`);

  if (localeToUse.startsWith("en")) {
    moment.locale(localeToUse);
  } else {
    // Dynamically import the locale based on the chosen locale
    import(`moment/locale/${localeToUse}`)
      .then(() => {
        moment.locale(localeToUse);  // Set Moment.js locale
        console.debug(`Locale imported: ${localeToUse}`);
      })
      .catch(() => {
        // Fallback in case the specific locale is not available
        const fallbackLocale = localeToUse.split('-')[0];  // e.g., 'pt-BR' -> 'pt'
        import(`moment/locale/${fallbackLocale}`).then(() => {
          moment.locale(fallbackLocale);
          console.debug(`Fallback locale imported: ${fallbackLocale}`);
        })
          .catch(() => {
            console.debug(`Failed to import fallback locale: ${fallbackLocale}`);
          });
      });
  }
}

await startMoment();
