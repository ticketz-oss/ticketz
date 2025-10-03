import { useCallback, useEffect, useMemo, useState } from "react";

const isClient = typeof window !== "undefined";

const checkStandalone = () => {
  if (!isClient) {
    return false;
  }

  const matchStandalone = window.matchMedia
    ? window.matchMedia("(display-mode: standalone)").matches
    : false;

  const navigatorStandalone = window.navigator.standalone === true;

  return matchStandalone || navigatorStandalone;
};

const detectIOS = () => {
  if (!isClient) {
    return false;
  }

  const userAgent = window.navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(userAgent);
};

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(checkStandalone());

  const isIOS = useMemo(() => detectIOS(), []);

  useEffect(() => {
    if (!isClient) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const matchMedia = window.matchMedia
      ? window.matchMedia("(display-mode: standalone)")
      : null;

    const handleDisplayModeChange = (event) => {
      if (event.matches) {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    };

    if (matchMedia?.addEventListener) {
      matchMedia.addEventListener("change", handleDisplayModeChange);
    } else if (matchMedia?.addListener) {
      matchMedia.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (matchMedia?.removeEventListener) {
        matchMedia.removeEventListener("change", handleDisplayModeChange);
      } else if (matchMedia?.removeListener) {
        matchMedia.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (err) {
      // ignore errors
    }
    setDeferredPrompt(null);
    return true;
  }, [deferredPrompt]);

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    isIOS,
    promptInstall,
  };
};

export default usePWAInstall;
