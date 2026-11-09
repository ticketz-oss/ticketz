import React, { createContext, useContext, useState, useEffect } from "react";
import {
  checkForUpdate,
  getCurrentAppInfo,
} from "../services/appUpdateService";
import { APP_VERSION } from "../config/appConfig";
import type {
  VersionInfo,
  CheckUpdateResult,
} from "../services/appUpdateService";
import { AppUpdateModal } from "../components/modals/AppUpdateModal";

interface AppUpdateContextType {
  updateInfo: VersionInfo | null;
  hasUpdate: boolean;
  currentVersion: string;
  isChecking: boolean;
  checkUpdatesManual: () => Promise<CheckUpdateResult>;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
}

const AppUpdateContext = createContext<AppUpdateContextType>({} as any);

export const AppUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(APP_VERSION);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial startup check
  useEffect(() => {
    let mounted = true;

    const runInitialCheck = async () => {
      // Small delay to allow main app to boot smoothly
      await new Promise((r) => setTimeout(r, 2500));
      if (!mounted) return;

      const appInfo = await getCurrentAppInfo();
      if (mounted) setCurrentVersion(appInfo.version);

      const result = await checkForUpdate();
      if (!mounted) return;

      if (result.hasUpdate && result.remoteInfo) {
        setHasUpdate(true);
        setUpdateInfo(result.remoteInfo);

        // Check if user previously dismissed this version in current session
        const dismissed = sessionStorage.getItem("dismissed_update_version");
        if (result.remoteInfo.mandatory || dismissed !== result.remoteInfo.version) {
          setIsModalOpen(true);
        }
      }
    };

    runInitialCheck();

    return () => {
      mounted = false;
    };
  }, []);

  const checkUpdatesManual = async () => {
    setIsChecking(true);
    try {
      const result = await checkForUpdate();
      setCurrentVersion(result.currentVersion);
      if (result.hasUpdate && result.remoteInfo) {
        setHasUpdate(true);
        setUpdateInfo(result.remoteInfo);
        setIsModalOpen(true);
      } else {
        setHasUpdate(false);
      }
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  const openUpdateModal = () => setIsModalOpen(true);
  const closeUpdateModal = () => {
    if (updateInfo) {
      sessionStorage.setItem("dismissed_update_version", updateInfo.version);
    }
    setIsModalOpen(false);
  };

  return (
    <AppUpdateContext.Provider
      value={{
        updateInfo,
        hasUpdate,
        currentVersion,
        isChecking,
        checkUpdatesManual,
        openUpdateModal,
        closeUpdateModal,
      }}
    >
      {children}
      <AppUpdateModal
        isOpen={isModalOpen}
        onClose={closeUpdateModal}
        updateInfo={updateInfo}
        currentVersion={currentVersion}
      />
    </AppUpdateContext.Provider>
  );
};

export const useAppUpdate = () => useContext(AppUpdateContext);
export default AppUpdateProvider;
