import React from "react";

// Inline icons copied from the "Atendimentos – Stories WhatsApp" design.
const Icon = ({ size = 16, strokeWidth = 1.8, children, ...props }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

export const ClockIcon = props => (
  <Icon size={12} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const PlusIcon = props => (
  <Icon size={20} strokeWidth={2} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CloseIcon = props => (
  <Icon size={18} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const ChevronLeftIcon = props => (
  <Icon size={20} strokeWidth={2} {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = props => (
  <Icon size={20} strokeWidth={2} {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const InfoIcon = props => (
  <Icon size={16} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </Icon>
);

export const CheckIcon = props => (
  <Icon size={16} strokeWidth={2.4} stroke="#4ADE80" {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const ImageIcon = props => (
  <Icon size={28} strokeWidth={1.6} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
);

export const SendIcon = props => (
  <Icon size={15} strokeWidth={2} {...props}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </Icon>
);

export const CalendarIcon = props => (
  <Icon size={15} {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Icon>
);

export const DownloadIcon = props => (
  <Icon size={15} {...props}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </Icon>
);
