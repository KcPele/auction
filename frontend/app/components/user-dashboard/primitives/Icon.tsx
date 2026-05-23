import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "search"
  | "gavel"
  | "trophy"
  | "wallet"
  | "user"
  | "bell"
  | "help"
  | "chevron"
  | "chevron-l"
  | "plus"
  | "arrow-up"
  | "arrow-down"
  | "arrow-r"
  | "clock"
  | "car"
  | "truck"
  | "phone"
  | "package"
  | "laptop"
  | "shield"
  | "check"
  | "check-c"
  | "x"
  | "x-c"
  | "filter"
  | "heart"
  | "share"
  | "image"
  | "tag"
  | "flame"
  | "chart"
  | "lock"
  | "mail"
  | "wa"
  | "settings"
  | "sliders"
  | "copy"
  | "refresh"
  | "gauge"
  | "calendar"
  | "zap"
  | "trend"
  | "key"
  | "play"
  | "edit";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, strokeWidth = 1.6, ...rest }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { display: "block" as const },
    ...rest,
  };
  switch (name) {
    case "home":
      return <svg {...p}><path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></svg>;
    case "search":
      return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "gavel":
      return <svg {...p}><path d="m14 6 4 4M11 9l4 4M8 12l4 4M6 14l4 4M3 21h8M17 3l4 4-7 7-4-4z" /></svg>;
    case "trophy":
      return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></svg>;
    case "wallet":
      return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M16 13h2M3 10h18" /></svg>;
    case "user":
      return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
    case "bell":
      return <svg {...p}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
    case "help":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7v.5M12 17h.01" /></svg>;
    case "chevron":
      return <svg {...p}><path d="m9 6 6 6-6 6" /></svg>;
    case "chevron-l":
      return <svg {...p}><path d="m15 6-6 6 6 6" /></svg>;
    case "plus":
      return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "arrow-up":
      return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case "arrow-down":
      return <svg {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>;
    case "arrow-r":
      return <svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
    case "clock":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "car":
      return <svg {...p}><path d="M5 17V11l2-5h10l2 5v6M5 17h14M5 17v2h2v-2M17 17v2h2v-2M7 11h10" /><circle cx="8" cy="14" r="1" /><circle cx="16" cy="14" r="1" /></svg>;
    case "truck":
      return <svg {...p}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
    case "phone":
      return <svg {...p}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></svg>;
    case "package":
      return <svg {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12 4.5 7.8M12 12l7.5-4.2M12 12v8.5" /></svg>;
    case "laptop":
      return <svg {...p}><rect x="4" y="5" width="16" height="11" rx="1" /><path d="M2 19h20" /></svg>;
    case "shield":
      return <svg {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "check":
      return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "check-c":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>;
    case "x":
      return <svg {...p}><path d="M6 6l12 12M18 6l-12 12" /></svg>;
    case "x-c":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></svg>;
    case "filter":
      return <svg {...p}><path d="M3 5h18M6 12h12M10 19h4" /></svg>;
    case "heart":
      return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>;
    case "share":
      return <svg {...p}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>;
    case "image":
      return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m3 17 5-5 5 5 3-3 5 5" /></svg>;
    case "tag":
      return <svg {...p}><path d="M20 12.5 12.5 20 3 10.5V3h7.5z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    case "flame":
      return <svg {...p}><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-2 2-2 5a6 6 0 0 0 12 0c0-5-7-11-7-11z" /></svg>;
    case "chart":
      return <svg {...p}><path d="M3 3v18h18M7 15l4-4 3 3 5-6" /></svg>;
    case "lock":
      return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case "mail":
      return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "wa":
      return <svg {...p}><path d="M3 21l2-5a8 8 0 1 1 3 3z" /><path d="M9 10c0 3 2 5 5 5M9 10c0-1 .5-2 1-2s1 2 1 2-.5 1-1 1M14 15c1 0 2-.5 2-1s-2-1-2-1-1 .5-1 1" /></svg>;
    case "settings":
      return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.2-1.7l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.9-1.7L13 2h-2l-.6 2.6a7 7 0 0 0-2.9 1.7l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .6.1 1.2.2 1.7l-2 1.5 2 3.4 2.3-.9c.8.7 1.8 1.3 2.9 1.7L11 22h2l.6-2.6c1-.4 2-1 2.9-1.7l2.3.9 2-3.4-2-1.5c.1-.5.2-1.1.2-1.7z" /></svg>;
    case "sliders":
      return <svg {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>;
    case "copy":
      return <svg {...p}><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M4 16V5a2 2 0 0 1 2-2h11" /></svg>;
    case "refresh":
      return <svg {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>;
    case "gauge":
      return <svg {...p}><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /><path d="M12 14v4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /><path d="M15 9l-1 1.5" /></svg>;
    case "calendar":
      return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "zap":
      return <svg {...p}><path d="M13 3 4 14h7l-1 7 9-11h-7z" /></svg>;
    case "trend":
      return <svg {...p}><path d="M3 17 9 11l4 4 8-8" /><path d="M14 7h7v7" /></svg>;
    case "key":
      return <svg {...p}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2" /></svg>;
    case "play":
      return <svg {...p}><path d="M7 4v16l13-8z" fill="currentColor" /></svg>;
    case "edit":
      return <svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" /></svg>;
    default:
      return null;
  }
}
