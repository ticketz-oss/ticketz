import React, { useEffect, useRef } from "react";
import { RedocStandalone } from "redoc";

export default function ApiReference({ spec, dark, onError }) {
  const anchorFrame = useRef();
  useEffect(() => () => cancelAnimationFrame(anchorFrame.current), []);

  return (
    <RedocStandalone
      spec={spec}
      onLoaded={error => {
        if (error) {
          onError(error);
          return;
        }
        // Redoc handles later hash changes; apply deep links after its async mount.
        let section;
        try {
          section = decodeURIComponent(window.location.hash.slice(1));
        } catch {
          return;
        }
        cancelAnimationFrame(anchorFrame.current);
        anchorFrame.current = requestAnimationFrame(() => {
          const target = document.querySelector(
            `[data-section-id="${CSS.escape(section)}"]`
          );
          if (target) {
            window.scrollTo({
              top:
                window.scrollY +
                target.getBoundingClientRect().top -
                (window.innerWidth <= 620 ? 182 : 154)
            });
          }
        });
      }}
      options={{
        hideDownloadButton: true,
        disableSearch: false,
        hideHostname: false,
        hideLoading: true,
        hideSingleRequestSampleTab: true,
        expandResponses: "200,201,204",
        requiredPropsFirst: true,
        sortPropsAlphabetically: false,
        pathInMiddlePanel: true,
        noAutoAuth: false,
        nativeScrollbars: true,
        scrollYOffset: () => (window.innerWidth <= 620 ? 182 : 154),
        theme: {
          colors: {
            primary: { main: dark ? "#80b8ff" : "#0000ff" },
            text: {
              primary: dark ? "#edf2f9" : "#161d27",
              secondary: dark ? "#b3c0d1" : "#576574"
            },
            border: {
              dark: dark ? "#394758" : "#dce3eb",
              light: dark ? "#29374a" : "#eaf0f7"
            },
            http: {
              get: "#168363",
              post: "#326ade",
              put: "#956918",
              delete: "#c03d50",
              patch: "#8058b0"
            }
          },
          typography: {
            fontSize: "15px",
            lineHeight: "1.65em",
            fontFamily: "Roboto, Arial, sans-serif",
            headings: {
              fontFamily: "Roboto, Arial, sans-serif",
              fontWeight: "600"
            },
            code: {
              fontFamily: "Consolas, monospace",
              fontSize: "13px",
              color: dark ? "#bbd5ff" : "#283f77",
              backgroundColor: dark ? "#19283e" : "#edf2fb"
            },
            links: {
              color: dark ? "#80b8ff" : "#0000ff",
              visited: dark ? "#80b8ff" : "#0000ff"
            }
          },
          sidebar: {
            width: "248px",
            backgroundColor: dark ? "#101c2b" : "#f6f8fb",
            textColor: dark ? "#b3c0d1" : "#576574",
            activeTextColor: dark ? "#a7caff" : "#0000ff"
          },
          rightPanel: {
            backgroundColor: "#101e32",
            textColor: "#e2ecff",
            width: "38%"
          },
          codeBlock: { backgroundColor: "#101e32" },
          schema: {
            nestedBackground: dark ? "#152236" : "#f6f8fb",
            requireLabelColor: dark ? "#ff9ba5" : "#b42335",
            arrow: { color: dark ? "#b3c0d1" : "#576574" }
          },
          spacing: { unit: 5, sectionHorizontal: 32, sectionVertical: 36 },
          breakpoints: { small: "50rem", medium: "85rem", large: "105rem" }
        }
      }}
    />
  );
}
