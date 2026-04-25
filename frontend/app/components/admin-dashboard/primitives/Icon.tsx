import type { CSSProperties } from "react";

export type AdminIconName =
  | "grid"
  | "radio"
  | "key"
  | "check"
  | "alert"
  | "users"
  | "wrench"
  | "receipt"
  | "bell"
  | "sliders"
  | "search"
  | "plus"
  | "close"
  | "menu"
  | "car"
  | "phone";

interface Props {
  name: AdminIconName;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

export function AdminIcon({ name, size = 16, strokeWidth = 1.7, style, className }: Props) {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
    className,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...c}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "radio":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="2" />
          <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19a10 10 0 0 1 0-14" />
        </svg>
      );
    case "key":
      return (
        <svg {...c}>
          <circle cx="8" cy="15" r="4" />
          <path d="M10.5 12L20 2l2 2-3 3 2 2-3 3-2-2" />
        </svg>
      );
    case "check":
      return (
        <svg {...c}>
          <path d="M9 11l3 3 8-8" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "alert":
      return (
        <svg {...c}>
          <path d="M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    case "users":
      return (
        <svg {...c}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...c}>
          <path d="M14.7 6.3a4 4 0 0 0 5 5l-8.3 8.3a2.8 2.8 0 0 1-4-4L15.7 7.3a4 4 0 0 0-1-1z" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...c}>
          <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...c}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...c}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case "search":
      return (
        <svg {...c}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...c} strokeWidth={2.4}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "close":
      return (
        <svg {...c} strokeWidth={2}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "menu":
      return (
        <svg {...c} strokeWidth={2}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "car":
      return (
        <svg {...c}>
          <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 5" />
          <path d="M3 13v4h2l1-2h12l1 2h2v-4" />
        </svg>
      );
    case "phone":
      return (
        <svg {...c}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
        </svg>
      );
    default:
      return null;
  }
}
