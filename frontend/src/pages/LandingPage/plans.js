import { useEffect, useState } from "react";
import { getContrastRatio } from "@material-ui/core/styles";
import { getBackendURL } from "../../services/config";

// AI packages sold separately on the basic plan. Prices are monthly, in BRL.
export const AI_ADDONS = [
  { id: "atendimento", value: 19.9 },
  { id: "equipe", value: 39.9 },
  { id: "gestao", value: 69.9 }
];

export const WHATSAPP_MODES = ["official", "unofficial"];

export const getPlanCapacityComparison = (plan, comparison) =>
  ["users", "connections", "queues"].map(key => {
    const value = Number(plan[key]);
    const baseline = Number(comparison?.[key]);
    return {
      key,
      value,
      extra:
        Number.isFinite(value) &&
        Number.isFinite(baseline) &&
        baseline > 0 &&
        value > baseline
          ? value - baseline
          : null
    };
  });

export const pricePerUser = plan => {
  const users = Number(plan?.users);
  const value = Number(plan?.value);
  return users > 0 && Number.isFinite(value) ? value / users : null;
};

// What moving from `plan` to Enterprise adds, priced as the monthly difference.
// `currentValue` lets the checkout include an AI package already chosen.
export const getEnterpriseUpgrade = (
  plan,
  enterprise,
  currentValue = Number(plan?.value)
) => {
  if (!plan || !enterprise || plan.id === enterprise.id) return null;
  const delta = Number(enterprise.value) - currentValue;
  if (!Number.isFinite(delta) || delta <= 0) return null;
  return {
    delta,
    capacities: getPlanCapacityComparison(enterprise, plan).filter(
      capacity => capacity.extra !== null
    )
  };
};

const TIER_ORDER = ["basic", "ai", "enterprise"];

const tierFromName = name => {
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (normalized.includes("enterprise")) return "enterprise";
  if (/\b(ai|ia)\b/.test(normalized)) return "ai";
  if (normalized.includes("basic")) return "basic";
  return null;
};

// Public plans come from the admin screen with free-form names. The checkout
// needs to know which one is the basic plan (AI billed apart) and which ones
// include unlimited AI, so names are matched first and price order fills the
// gaps: cheapest is basic, most expensive is enterprise.
export const classifyPlans = plans => {
  const sorted = [...plans].sort((a, b) => Number(a.value) - Number(b.value));
  const used = new Set();
  const withTier = sorted.map(plan => {
    const tier = tierFromName(plan.name);
    if (tier && !used.has(tier)) {
      used.add(tier);
      return { ...plan, tier };
    }
    return { ...plan, tier: null };
  });
  const free = TIER_ORDER.filter(tier => !used.has(tier));
  const untiered = withTier.filter(plan => !plan.tier);
  untiered.forEach((plan, index) => {
    if (untiered.length === 1 && free.length) {
      plan.tier = free[0];
    } else if (index === 0 && free.includes("basic")) {
      plan.tier = "basic";
    } else if (index === untiered.length - 1 && free.includes("enterprise")) {
      plan.tier = "enterprise";
    } else {
      plan.tier = free.includes("ai") ? "ai" : "custom";
    }
  });
  return withTier.map(plan => ({
    ...plan,
    aiIncluded: plan.tier === "ai" || plan.tier === "enterprise"
  }));
};

export const formatMoney = (value, currency = "BRL") => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL"
    }).format(Number(value) || 0);
  } catch (_) {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
};

export const usePublicPlans = () => {
  const [state, setState] = useState({ plans: [], status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getBackendURL()}/plans/listpublic`, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : Promise.reject()))
      .then(plans => {
        const list = Array.isArray(plans) ? plans : [];
        setState({
          plans: classifyPlans(list),
          status: list.length ? "ready" : "empty"
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ plans: [], status: "error" });
        }
      });
    return () => controller.abort();
  }, []);

  return state;
};

export const useSignupAllowed = () => {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getBackendURL()}/public-settings/allowSignup`, {
      signal: controller.signal
    })
      .then(response => (response.ok ? response.json() : null))
      .then(value => setAllowed(value === "enabled"))
      .catch(() => {
        if (!controller.signal.aborted) setAllowed(false);
      });
    return () => controller.abort();
  }, []);

  return allowed;
};

// Brand colours configured by the platform owner, as CSS variables.
export const useBrandColors = () => {
  const [brand, setBrand] = useState({
    primaryColorLight: "#0000FF",
    primaryColorDark: "#39ACE7"
  });

  useEffect(() => {
    const controller = new AbortController();
    ["primaryColorLight", "primaryColorDark"].forEach(key => {
      fetch(`${getBackendURL()}/public-settings/${key}`, {
        signal: controller.signal
      })
        .then(response => (response.ok ? response.json() : null))
        .then(value => {
          if (typeof value === "string" && /^#[\da-f]{6}$/i.test(value)) {
            setBrand(current => ({ ...current, [key]: value }));
          }
        })
        .catch(() => {});
    });
    return () => controller.abort();
  }, []);

  return {
    "--co-primary": brand.primaryColorLight,
    "--co-accent": brand.primaryColorDark,
    "--co-on-primary":
      getContrastRatio(brand.primaryColorLight, "#fff") >= 4.5
        ? "#fff"
        : "#111820"
  };
};

// Public pages scroll inside #root; this class gives it the page background.
export const useLandingRoot = () => {
  useEffect(() => {
    const root = document.getElementById("root");
    root?.classList.add("landing-root");
    return () => root?.classList.remove("landing-root");
  }, []);
};

export const assetUrl = path => `${process.env.PUBLIC_URL || ""}${path}`;
