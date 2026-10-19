import { useEffect, useRef } from "react";

// Observe the application's scroll container, not the window. Content remains
// visible without observer support; only elements entering view are animated.
export default function useLandingMotion() {
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!page || !("IntersectionObserver" in window)) return;

    let observer;
    const configure = () => {
      observer?.disconnect();
      page.classList.toggle("lp-motion-enabled", !preference.matches);
      if (preference.matches) return;

      observer = new IntersectionObserver(
        entries => {
          entries.forEach(({ target, isIntersecting }) => {
            target.classList.toggle("lp-in-view", isIntersecting);
            if (isIntersecting) target.classList.add("lp-revealed");
          });
        },
        {
          root: document.getElementById("root"),
          threshold: 0.12
        }
      );
      page.querySelectorAll("[data-lp-motion]").forEach(element => {
        observer.observe(element);
      });
    };

    configure();
    preference.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configure);
    };
  }, []);

  return pageRef;
}
