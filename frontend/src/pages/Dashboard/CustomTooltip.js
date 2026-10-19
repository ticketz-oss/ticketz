import React from "react";
import { useTheme } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";

const CustomTooltip = ({ payload, label, active, i18nBase }) => {
  const theme = useTheme();
  const textColor = theme.isStardew ? theme.stardew.ink : "white";
  const textSize = theme.isStardew ? 18 : 13;
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: theme.isStardew ? theme.stardew.paper : "#333",
          border: theme.isStardew
            ? `2px solid ${theme.stardew.border}`
            : undefined,
          boxShadow: theme.isStardew ? "3px 3px 0 #5b341f" : undefined,
          fontFamily: theme.isStardew ? theme.typography.fontFamily : undefined,
          borderRadius: theme.isStardew ? 0 : 4,
          outline: "none",
          padding: "10px"
        }}
      >
        <div
          style={{ color: textColor, fontWeight: "600", fontSize: textSize }}
        >
          {label}
        </div>
        {payload.map((item, index) => (
          <div
            key={index}
            style={{
              color: textColor,
              fontWeight: theme.isStardew ? 700 : 400,
              fontSize: textSize
            }}
          >
            {`${i18nBase ? i18n.t(i18nBase + "." + item.name) : item.name}: ${item.value}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
