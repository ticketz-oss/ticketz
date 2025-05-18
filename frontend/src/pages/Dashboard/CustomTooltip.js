import React from 'react';
import { i18n } from '../../translate/i18n';

const CustomTooltip = ({ payload, label, active, i18nBase }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: "#333", borderRadius: "4px", outline: "none", padding: "10px" }}>
        <div style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>{label}</div>
        {payload.map((item, index) => (
          <div key={index} style={{ color: "white", fontWeight: "400", fontSize: "13px" }}>
            {`${i18nBase ? i18n.t(i18nBase+"."+item.name) : item.name}: ${item.value}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default CustomTooltip;
