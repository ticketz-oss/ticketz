import React, { forwardRef, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { icons } from "./icons";

// Animate SVG elements, never the outer icon/button. Bubble and tile variants
// adapted from AnimateIcons (MIT); source attribution and license in NOTICE.md.
const draw = {
  normal: { pathLength: 1, opacity: 1 },
  animate: index => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: { delay: index * 0.09, duration: 0.5, ease: "easeInOut" }
  })
};
const bubble = {
  normal: { scale: 1, opacity: 1 },
  animate: {
    scale: [0.3, 1.05, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.55,
      times: [0, 0.7, 1],
      ease: [0.34, 1.4, 0.64, 1]
    }
  }
};
const textLine = {
  ...draw,
  animate: index => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      delay: 0.16 + index * 0.1,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};
const tile = {
  normal: { opacity: 1, scale: 1, y: 0 },
  animate: index => ({
    opacity: [0, 1],
    scale: [0.4, 1.04, 1],
    y: [3, -2, 0],
    transition: { duration: 0.54, ease: "easeInOut", delay: index * 0.08 }
  })
};
const person = {
  normal: { opacity: 1, x: 0, pathLength: 1 },
  animate: index => ({
    opacity: [0, 1],
    x: [index < 2 ? -3 : 3, 0],
    pathLength: [0, 1],
    transition: { duration: 0.5, delay: index * 0.08, ease: "easeOut" }
  })
};
const lid = {
  normal: { y: 0, pathLength: 1, opacity: 1 },
  animate: {
    y: [0, -3, 0],
    pathLength: [0, 1, 1],
    opacity: [0, 1, 1],
    transition: { duration: 0.7, ease: "easeInOut" }
  }
};
export const variantsFor = (name, index) => {
  if (name === "LayoutDashboard") return tile;
  if (["MessageSquare", "MessageCircle"].includes(name))
    return index === 0 ? bubble : textLine;
  if (["Users", "UserRound", "Contact"].includes(name)) return person;
  if (name === "Archive" && index === 0) return lid;
  return draw;
};

const AnimatedIcon = forwardRef(function AnimatedIcon(
  { name, size = 20, fontSize, color, className = "", style, ...props },
  forwardedRef
) {
  const svgRef = useRef(null);
  const controls = useAnimation();
  // MUI's hook observes live preference changes; Motion 6 snapshots only at mount.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    const svg = svgRef.current;
    // Whole action is the hit target, including its label/badges. Native listeners
    // preserve the existing React, MUI and Radix handlers and navigation.
    const target = svg.closest("button, a, [role='button'], label") || svg;
    let hovered = false;
    let focused = false;
    const update = () => {
      if (
        reducedMotion ||
        target.matches(":disabled, [aria-disabled='true']")
      ) {
        controls.stop();
        controls.set("normal");
      } else if (hovered || focused) controls.start("animate");
      else {
        controls.stop();
        controls.set("normal");
      }
    };
    const enter = () => {
      hovered = true;
      if (!focused) update();
    };
    const leave = () => {
      hovered = false;
      if (!focused) update();
    };
    const focus = () => {
      focused = true;
      if (!hovered) update();
    };
    const blur = event => {
      if (target.contains(event.relatedTarget)) return;
      focused = false;
      if (!hovered) update();
    };
    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    target.addEventListener("focusin", focus);
    target.addEventListener("focusout", blur);
    if (reducedMotion) update();
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
      target.removeEventListener("focusin", focus);
      target.removeEventListener("focusout", blur);
      controls.stop();
    };
  }, [controls, reducedMotion]);
  const dimension =
    fontSize === "small" ? 20 : fontSize === "large" ? 32 : size;
  return (
    <svg
      {...props}
      ref={node => {
        svgRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke={
        color &&
        ![
          "inherit",
          "primary",
          "secondary",
          "action",
          "disabled",
          "error"
        ].includes(color)
          ? color
          : "currentColor"
      }
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`ew-animated-icon ${className}`}
      data-animated-icon={name}
      style={{ flexShrink: 0, verticalAlign: "middle", ...style }}
    >
      {icons[name].map(([tag, attributes], index) => {
        const Shape = motion[tag];
        return (
          <Shape
            key={index}
            {...attributes}
            custom={index}
            variants={variantsFor(name, index)}
            initial="normal"
            animate={controls}
          />
        );
      })}
    </svg>
  );
});
export default AnimatedIcon;
const icon = name => {
  const Component = forwardRef((props, ref) => (
    <AnimatedIcon {...props} ref={ref} name={name} />
  ));
  Component.displayName = `Animated${name}`;
  return Component;
};
export const LayoutDashboard = icon("LayoutDashboard");
export const ArrowRightLeft = icon("ArrowRightLeft");
export const History = icon("History");
export const StickyNote = icon("StickyNote");
export const Files = icon("Files");
export const Printer = icon("Printer");
export const MessageSquare = icon("MessageSquare");
export const MessageCircle = icon("MessageCircle");
export const Users = icon("Users");
export const UsersRound = Users;
export const UserRound = icon("UserRound");
export const Contact = icon("Contact");
export const Settings = icon("Settings");
export const Workflow = icon("Workflow");
export const Zap = icon("Zap");
export const CircleHelp = icon("CircleHelp");
export const Calendar = icon("Calendar");
export const CalendarClock = Calendar;
export const Tag = icon("Tag");
export const Tags = Tag;
export const List = icon("List");
export const Megaphone = icon("Megaphone");
export const Banknote = icon("Banknote");
export const ReceiptText = icon("ReceiptText");
export const Pencil = icon("Pencil");
export const Refresh = icon("Refresh");
export const Plus = icon("Plus");
export const X = icon("X");
export const Search = icon("Search");
export const Archive = icon("Archive");
export const Send = icon("Send");
export const Paperclip = icon("Paperclip");
export const Download = icon("Download");
export const Mic = icon("Mic");
export const Check = icon("Check");
export const Eye = icon("Eye");
export const Trash2 = icon("Trash2");
