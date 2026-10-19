import { useTheme } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { i18n } from "../../translate/i18n";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { getTimezoneOffset } from "../../helpers/getTimezoneOffset";
import { getISOStringWithTimezone } from "../../helpers/getISOStringWithTimezone";

function prepareChartData(emptyData, serie) {
  const ticketCreateData = JSON.parse(JSON.stringify(emptyData));
  serie.counters.forEach(item => {
    const date = new Date(item.time);
    const dateKey =
      serie.field === "day"
        ? getISOStringWithTimezone(date).split("T")[0]
        : getISOStringWithTimezone(date).split(".")[0];
    ticketCreateData[dateKey] = Number(item.counter);
  });
  return ticketCreateData;
}

export function TicketCountersChart({ ticketCounters }) {
  const now = new Date();
  const tz = getTimezoneOffset();
  const theme = useTheme();
  const t = (...params) => i18n.t(...params);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!ticketCounters?.create?.field) return;

    const field = ticketCounters.create.field;
    const step = {
      twelve_hours: 720,
      six_hours: 360,
      three_hours: 180,
      hour: 60,
      timestamp: 30
    };

    const startDate = new Date(ticketCounters.create.start);
    const endDate = new Date(ticketCounters.create.end);

    if (endDate > now) {
      endDate.setTime(now.getTime());
    }
    const xAxisEmptyData = {};

    if (field === "day") {
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        xAxisEmptyData[getISOStringWithTimezone(currentDate).split("T")[0]] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        xAxisEmptyData[getISOStringWithTimezone(currentDate).split(".")[0]] = 0;
        currentDate.setMinutes(currentDate.getMinutes() + step[field]);
      }
    }

    const createData = prepareChartData(xAxisEmptyData, ticketCounters.create);
    const closeData = prepareChartData(xAxisEmptyData, ticketCounters.close);

    const chartData = Object.keys(createData).map(key => ({
      time: key,
      created: createData[key] || 0,
      closed: closeData[key] || 0
    }));

    setChartData(chartData);
  }, [ticketCounters]);

  return (
    <React.Fragment>
      <h2>{t("dashboard.ticketsOnPeriod")}</h2>
      <div className="painel-grafico-conteudo">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart
            data={chartData}
            barSize={18}
            margin={{
              top: 16,
              right: 16,
              bottom: 0,
              left: 0
            }}
          >
            <XAxis
              dataKey={({ time }) => {
                if (time.includes("T")) {
                  // time already has timezone info from getISOStringWithTimezone, don't append tz again
                  const date = new Date(time);
                  if (
                    date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  ) {
                    return date.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                  }
                  if (
                    date.getDate() >= now.getDate() - 6 &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  ) {
                    return date
                      .toLocaleDateString(undefined, {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                      .replace(",", "");
                  }
                  if (date.getFullYear() === now.getFullYear()) {
                    return date
                      .toLocaleDateString(undefined, {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                      .replace(",", "");
                  }
                  return date
                    .toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                    .replace(",", "");
                } else {
                  // For day-only format, append timezone since it's just a date string
                  const date = new Date(`${time}T00:00:00${tz}`);
                  if (date.getFullYear() === now.getFullYear()) {
                    return date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "2-digit"
                    });
                  }
                  return date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit"
                  });
                }
              }}
              tickLine={false}
              axisLine={false}
              stroke={theme.palette.text.secondary}
            />
            <YAxis
              type="number"
              allowDecimals={false}
              stroke={theme.palette.text.secondary}
              tickLine={false}
              axisLine={false}
            />
            <CartesianGrid vertical={false} strokeDasharray="4" opacity={0.3} />
            <Tooltip
              content={
                <CustomTooltip i18nBase="dashboard.ticketCountersLabels" />
              }
              cursor={true}
            />
            <Bar
              radius={theme.isStardew ? [0, 0, 0, 0] : [3, 3, 0, 0]}
              dataKey="created"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              fill={theme.palette.primary.main}
            />
            <Bar
              radius={theme.isStardew ? [0, 0, 0, 0] : [3, 3, 0, 0]}
              dataKey="closed"
              stroke={theme.isStardew ? theme.stardew.border : "#416971"}
              strokeWidth={2}
              fill={theme.isStardew ? theme.stardew.gold : "#416971"}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </React.Fragment>
  );
}
