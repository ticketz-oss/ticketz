// The web package includes its own React 18 runtime. Use its renderer directly
// so the surrounding React 17 application does not load the OneWorks editor.
import React18 from "../../../node_modules/@oneworks/avatar-web/node_modules/react";
import { createRoot } from "../../../node_modules/@oneworks/avatar-web/node_modules/react-dom/client";
import { Avatar } from "../../../node_modules/@oneworks/avatar-web/node_modules/@oneworks/avatar-react/dist/renderer.js";

export function mountAvatar(host, options) {
  const root = createRoot(host);
  let resolveReady;
  const ready = new Promise(resolve => {
    resolveReady = resolve;
  });
  root.render(
    React18.createElement(Avatar, {
      ...options,
      ref: instance => {
        if (instance) resolveReady();
      }
    })
  );
  return {
    ready,
    destroy() {
      resolveReady();
      root.unmount();
    }
  };
}
