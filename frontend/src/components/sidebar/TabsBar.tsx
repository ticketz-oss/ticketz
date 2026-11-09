import React, { useEffect } from "react";
import { useTickets, type TabType } from "../../context/TicketsContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { MessageSquare, Clock, CheckCircle2, Users } from "lucide-react";

export const TabsBar: React.FC = () => {
  const { tab, setTab, tabCounts } = useTickets();
  const { settings } = useSettingsContext();

  // If CheckMsgIsGroup is "enabled", ignore groups is active -> hide groups tab
  // If CheckMsgIsGroup is "disabled", groups are received -> show groups tab
  const ignoreGroups = settings.CheckMsgIsGroup !== "disabled";

  useEffect(() => {
    if (ignoreGroups && tab === "groups") {
      setTab("open");
    }
  }, [ignoreGroups, tab, setTab]);

  const allTabs: {
    id: TabType;
    label: string;
    icon: React.FC<{ size?: number; className?: string }>;
    count: number;
    color: string;
  }[] = [
    {
      id: "open",
      label: "Atendendo",
      icon: MessageSquare,
      count: tabCounts.open,
      color: "bg-whatsapp-green text-white",
    },
    {
      id: "pending",
      label: "Aguardando",
      icon: Clock,
      count: tabCounts.pending,
      color: "bg-amber-500 text-white",
    },
    {
      id: "closed",
      label: "Finalizados",
      icon: CheckCircle2,
      count: tabCounts.closed,
      color: "bg-gray-400 text-white",
    },
    {
      id: "groups",
      label: "Grupos",
      icon: Users,
      count: tabCounts.groups,
      color: "bg-blue-500 text-white",
    },
  ];

  const visibleTabs = ignoreGroups
    ? allTabs.filter((t) => t.id !== "groups")
    : allTabs;

  return (
    <div className="flex border-b border-whatsapp-light-border dark:border-whatsapp-dark-border bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel select-none">
      {visibleTabs.map((t) => {
        const isActive = tab === t.id;
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            type="button"
            className={`flex-1 py-2 px-1 flex flex-col items-center justify-center relative transition ${
              isActive
                ? "text-whatsapp-green font-semibold"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={13} />
              <span className="text-[11px] truncate">{t.label}</span>
              {t.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                    isActive ? t.color : "bg-gray-200 dark:bg-whatsapp-dark-hover text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {t.count > 999 ? "999+" : t.count}
                </span>
              )}
            </div>

            {/* Active bottom indicator bar */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-whatsapp-green rounded-t" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabsBar;
