// Official framework-independent Clerk browser SDK. Loading it from the instance
// avoids pulling React 18 UI / web3 wallet dependencies into this React 17 app.
export function loadClerkBrowser(publishableKey) {
  return new Promise((resolve, reject) => {
    let domain;
    try {
      domain = atob(publishableKey.replace(/^pk_(test|live)_/, "")).replace(
        /\$$/,
        ""
      );
      if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain))
        throw new Error();
    } catch (_) {
      reject(new Error("ERR_SOCIAL_LOGIN_DISABLED"));
      return;
    }
    const existing = document.getElementById("espaco-clerk-sdk");
    if (existing) {
      reject(new Error("ERR_SOCIAL_LOGIN_INVALID"));
      return;
    }
    const script = document.createElement("script");
    script.id = "espaco-clerk-sdk";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-clerk-publishable-key", publishableKey);
    script.src = `https://${domain}/npm/@clerk/clerk-js@6.31.1/dist/clerk.browser.js`;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("ERR_SOCIAL_LOGIN_DISABLED"));
    };
    const timeout = setTimeout(fail, 20000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      const clerk = window.Clerk;
      if (
        !clerk ||
        clerk.publishableKey !== publishableKey ||
        typeof clerk.load !== "function"
      ) {
        fail();
        return;
      }
      resolve(clerk);
    };
    document.head.appendChild(script);
  });
}
