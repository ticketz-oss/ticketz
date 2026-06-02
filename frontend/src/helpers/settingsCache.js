const SETTINGS_CACHE_KEYS_STORAGE_KEY = "cachedSettingsKeys";

function isSessionStorageAvailable() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function getCachedSettingsKeys() {
  if (!isSessionStorageAvailable()) {
    return [];
  }

  try {
    const rawValue = sessionStorage.getItem(SETTINGS_CACHE_KEYS_STORAGE_KEY);
    const parsedValue = JSON.parse(rawValue || "[]");
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(key => typeof key === "string" && key);
  } catch (_err) {
    return [];
  }
}

function setCachedSettingsKeys(keys) {
  if (!isSessionStorageAvailable()) {
    return;
  }

  sessionStorage.setItem(
    SETTINGS_CACHE_KEYS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(keys)))
  );
}

function addCachedSettingsKey(key) {
  if (!key) {
    return;
  }

  const keys = getCachedSettingsKeys();
  if (!keys.includes(key)) {
    keys.push(key);
    setCachedSettingsKeys(keys);
  }
}

function clearCachedSettingsKey(key) {
  if (!isSessionStorageAvailable() || !key) {
    return;
  }

  sessionStorage.removeItem(key);
  sessionStorage.removeItem(`${key}_timestamp`);

  const keys = getCachedSettingsKeys().filter(cachedKey => cachedKey !== key);
  if (keys.length === 0) {
    sessionStorage.removeItem(SETTINGS_CACHE_KEYS_STORAGE_KEY);
    return;
  }

  setCachedSettingsKeys(keys);
}

function clearAllCachedSettings() {
  if (!isSessionStorageAvailable()) {
    return;
  }

  const keys = getCachedSettingsKeys();
  keys.forEach(key => {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_timestamp`);
  });

  sessionStorage.removeItem(SETTINGS_CACHE_KEYS_STORAGE_KEY);
}

function setCachedSettingValue(key, value) {
  if (!isSessionStorageAvailable() || !key) {
    return;
  }

  addCachedSettingsKey(key);
  sessionStorage.setItem(key, JSON.stringify(value));
  sessionStorage.setItem(`${key}_timestamp`, Date.now());
}

export {
  clearAllCachedSettings,
  clearCachedSettingsKey,
  setCachedSettingValue
};
