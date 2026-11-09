import React, { useEffect, useState, useRef, useCallback } from "react";
import { App as CapApp } from "@capacitor/app";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AudioPlaybackProvider } from "./context/AudioPlaybackContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TicketsProvider, useTickets } from "./context/TicketsContext";
import { AppUpdateProvider } from "./context/AppUpdateContext";
import LateralNavRail from "./components/layout/LateralNavRail";
import Sidebar from "./components/sidebar/Sidebar";
import ChatArea from "./components/chat/ChatArea";
import LoginPage from "./components/login/LoginPage";
import MobileLandingPage from "./components/landing/MobileLandingPage";
import { isMobileApp } from "./services/api";

// Modals & Popups
import NewTicketModal from "./components/modals/NewTicketModal";
import ContactsModal from "./components/modals/ContactsModal";
import QuickMessagesModal from "./components/modals/QuickMessagesModal";
import TagsModal from "./components/modals/TagsModal";
import QueuesModal from "./components/modals/QueuesModal";
import ConnectionsModal from "./components/modals/ConnectionsModal";
import TransferModal from "./components/modals/TransferModal";
import UsersModal from "./components/modals/UsersModal";
import NotificationModal from "./components/modals/NotificationModal";
import SettingsModal from "./components/modals/SettingsModal";
import NotificationToastsContainer from "./components/common/NotificationToastsContainer";

const MainLayout: React.FC = () => {
  const { isAuth, loading } = useAuth();
  const {
    selectedTicket,
    setSelectedTicket,
    activeModal,
    setActiveModal,
    contactDrawerOpen,
    setContactDrawerOpen,
    searchQuery,
    setSearchQuery,
    zoomedImage,
    setZoomedImage,
    pdfModalData,
    setPdfModalData,
    droppedFiles,
    setDroppedFiles,
  } = useTickets();

  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDarkMode && !document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Stable state ref so back button handlers never suffer from stale closures
  const stateRef = useRef({
    zoomedImage,
    pdfModalData,
    droppedFiles,
    activeModal,
    contactDrawerOpen,
    selectedTicket,
    searchQuery,
  });

  useEffect(() => {
    stateRef.current = {
      zoomedImage,
      pdfModalData,
      droppedFiles,
      activeModal,
      contactDrawerOpen,
      selectedTicket,
      searchQuery,
    };
  }, [
    zoomedImage,
    pdfModalData,
    droppedFiles,
    activeModal,
    contactDrawerOpen,
    selectedTicket,
    searchQuery,
  ]);

  // Unified single source of truth for cascading back navigation
  // Closes layers in strict order: Media/PDF Lightbox -> Modals -> Drawer -> Conversation -> Search query
  const handleBackCascade = useCallback((): boolean => {
    const s = stateRef.current;

    // 1. Topmost media view: Image Lightbox
    if (s.zoomedImage) {
      setZoomedImage(null);
      return true;
    }

    // 2. In-app PDF Viewer
    if (s.pdfModalData) {
      setPdfModalData(null);
      return true;
    }

    // 3. Media drop preview modal
    if (s.droppedFiles && s.droppedFiles.length > 0) {
      setDroppedFiles([]);
      return true;
    }

    // 4. Global Modals (NewTicket, Settings, Contacts, QuickMessages, etc.)
    if (s.activeModal) {
      setActiveModal(null);
      return true;
    }

    // 5. Contact Drawer inside chat
    if (s.contactDrawerOpen) {
      setContactDrawerOpen(false);
      return true;
    }

    // 6. Mobile Open Conversation: exit conversation and return to conversation list
    if (s.selectedTicket) {
      setSelectedTicket(null);
      return true;
    }

    // 7. Search query filter in ticket list
    if (s.searchQuery && s.searchQuery.trim().length > 0) {
      setSearchQuery("");
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        activeEl.blur();
      }
      return true;
    }

    // Nothing active: user is already at the root conversation list
    return false;
  }, [
    setZoomedImage,
    setPdfModalData,
    setDroppedFiles,
    setActiveModal,
    setContactDrawerOpen,
    setSelectedTicket,
    setSearchQuery,
  ]);

  // Compute depth of active layers (0 = root screen)
  const activeDepth =
    (zoomedImage ? 1 : 0) +
    (pdfModalData ? 1 : 0) +
    (droppedFiles && droppedFiles.length > 0 ? 1 : 0) +
    (activeModal ? 1 : 0) +
    (contactDrawerOpen ? 1 : 0) +
    (selectedTicket ? 1 : 0) +
    (searchQuery && searchQuery.trim().length > 0 ? 1 : 0);

  const pushedDepthRef = useRef<number>(0);
  const isPoppingRef = useRef<boolean>(false);

  // Synchronize browser history states for PWA / Web navigation
  useEffect(() => {
    // If the change came from popstate, don't re-push history
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }

    const currentPushed = pushedDepthRef.current;
    if (activeDepth > currentPushed) {
      // Push history entries matching each newly opened layer
      for (let i = currentPushed; i < activeDepth; i++) {
        window.history.pushState({ appDepth: i + 1 }, "");
      }
      pushedDepthRef.current = activeDepth;
    }
  }, [activeDepth]);

  // PWA / Browser History PopState (System / Gesture Back button)
  useEffect(() => {
    const handlePopState = () => {
      // If native camera is active or recently dismissed, ignore
      if ((window as any).__cameraActive) {
        return;
      }

      isPoppingRef.current = true;
      if (pushedDepthRef.current > 0) {
        pushedDepthRef.current--;
      }

      handleBackCascade();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleBackCascade]);

  // On-screen back button on mobile chat header
  const handleBackMobile = useCallback(() => {
    if (pushedDepthRef.current > 0) {
      window.history.back();
    } else {
      handleBackCascade();
    }
  }, [handleBackCascade]);

  // Desktop ESC key handler: delegates to unified cascade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const handled = handleBackCascade();
        if (handled) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBackCascade]);

  // Android Capacitor Native App Back Button handling
  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const setupBackButton = async () => {
      try {
        const listener = await CapApp.addListener("backButton", () => {
          if ((window as any).__cameraActive) {
            return;
          }

          const handled = handleBackCascade();
          // If no layer was active (already at root ticket list), minimize app
          if (!handled) {
            CapApp.minimizeApp();
          }
        });
        removeListener = () => listener.remove();
      } catch {
        // Not running on Capacitor native
      }
    };

    setupBackButton();
    return () => {
      removeListener?.();
    };
  }, [handleBackCascade]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-whatsapp-light-bg dark:bg-whatsapp-dark-bg text-whatsapp-green">
        <div className="w-8 h-8 border-3 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-whatsapp-light-bg dark:bg-whatsapp-dark-bg text-whatsapp-light-text dark:text-whatsapp-dark-text select-none">
      {/* 56px Navigation Rail on Left: Always visible on desktop & tablets (>= sm: 640px) */}
      <div className="hidden sm:flex h-full shrink-0">
        <LateralNavRail />
      </div>

      {/* Ticket List Sidebar: On mobile (< sm: 640px), hides when chat is open; On desktop (>= sm), always visible! */}
      <div
        className={`h-full ${
          selectedTicket ? "hidden sm:flex" : "flex w-full sm:w-auto"
        }`}
      >
        <Sidebar />
      </div>

      {/* Chat Area: Full width on mobile when chat is open; Flexible on desktop */}
      <div
        className={`h-full flex-1 min-w-0 ${
          !selectedTicket ? "hidden sm:flex" : "flex"
        }`}
      >
        <ChatArea onBackMobile={handleBackMobile} />
      </div>

      {/* Global Modals */}
      <NewTicketModal />
      <ContactsModal />
      <QuickMessagesModal />
      <TagsModal />
      <QueuesModal />
      <ConnectionsModal />
      <TransferModal />
      <UsersModal />
      <NotificationModal />
      <SettingsModal />

      {/* Floating In-App Toast Popups */}
      <NotificationToastsContainer />
    </div>
  );
};

export const App: React.FC = () => {
  const [viewingMobileLanding, setViewingMobileLanding] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const pathname = window.location.pathname.toLowerCase();
    if (pathname === "/mobile" || pathname.startsWith("/mobile/")) return true;

    // Inside native Capacitor APK app or installed PWA standalone mode: never show landing page
    if (isMobileApp()) return false;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return false;

    // Check if explicitly requesting web version
    const params = new URLSearchParams(window.location.search);
    if (params.get("web") === "true") return false;
    try {
      if (localStorage.getItem("prefer_web") === "true") return false;
      if (sessionStorage.getItem("prefer_web") === "true") return false;
    } catch {}

    // Check mobile user agent
    const ua = navigator.userAgent || "";
    return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  });

  if (viewingMobileLanding) {
    return (
      <MobileLandingPage
        onContinueWeb={() => {
          try {
            localStorage.setItem("prefer_web", "true");
            sessionStorage.setItem("prefer_web", "true");
            window.history.pushState({}, "", "/?web=true");
          } catch {}
          setViewingMobileLanding(false);
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <AudioPlaybackProvider>
          <NotificationProvider>
            <TicketsProvider>
              <AppUpdateProvider>
                <MainLayout />
              </AppUpdateProvider>
            </TicketsProvider>
          </NotificationProvider>
        </AudioPlaybackProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
