import { useTheme } from "@material-ui/core/styles";
import React, { useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import CustomTooltip from "./CustomTooltip";
import { i18n } from "../../translate/i18n";

export function SmallPie({ chartData, size = 100 }) {
  const theme = useTheme();
  const [highlighted, setHighlighted] = useState(null);

  if (theme.isStardew) {
    const total = chartData.reduce((sum, item) => sum + Number(item.value), 0);
    let offset = 0;
    return (
      <div
        className="sv-pixel-distribution"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 160 160"
          role="img"
          aria-label={i18n.t("visual.distribuicaoFilas")}
          shapeRendering="crispEdges"
        >
          <path
            d="M20 20H140V140H20Z"
            fill="none"
            stroke="#8b451d"
            strokeWidth="26"
          />
          <path
            d="M20 20H140V140H20Z"
            fill="none"
            stroke="#f5d995"
            strokeWidth="20"
          />
          {chartData.map((item, index) => {
            // The square's perimeter is 480 units. Segment lengths retain the
            // exact data proportions rather than rounding into pixel slots.
            const length = total > 0 ? (Number(item.value) / total) * 480 : 0;
            const start = offset;
            offset += length;
            return (
              <path
                key={`${item.name}-${index}`}
                d="M20 20H140V140H20Z"
                fill="none"
                stroke={item.color || theme.stardew.green}
                strokeWidth="20"
                strokeDasharray={`${length} ${480 - length}`}
                strokeDashoffset={-start}
                tabIndex={0}
                aria-label={`${item.name}: ${item.value}`}
                onMouseEnter={() => setHighlighted(item)}
                onMouseLeave={() => setHighlighted(null)}
                onFocus={() => setHighlighted(item)}
                onBlur={() => setHighlighted(null)}
              >
                <title>{`${item.name}: ${item.value}`}</title>
              </path>
            );
          })}
        </svg>
        {highlighted && (
          <div className="sv-pixel-distribution-tooltip">
            <CustomTooltip active payload={[highlighted]} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="95%"
          fill={theme.palette.primary.main}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} cursor={true} />
      </PieChart>
    </div>
  );
}
