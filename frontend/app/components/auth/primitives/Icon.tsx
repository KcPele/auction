import type { SVGProps } from "react";

export type IconName =
  | "mail"
  | "lock"
  | "phone"
  | "check"
  | "check-c"
  | "x"
  | "chevron-l"
  | "arrow-r"
  | "tag"
  | "shield"
  | "image"
  | "calendar"
  | "car";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

const PATHS: Record<IconName, React.ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  "check-c": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6l-12 12" />,
  "chevron-l": <path d="m15 6-6 6 6 6" />,
  "arrow-r": <path d="M5 12h14M12 5l7 7-7 7" />,
  tag: (
    <>
      <path d="M20 12.5 12.5 20 3 10.5V3h7.5z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m3 17 5-5 5 5 3-3 5 5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  car: (
    <>
      <path d="M5 17V11l2-5h10l2 5v6M5 17h14M5 17v2h2v-2M17 17v2h2v-2M7 11h10" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </>
  ),
};

export function Icon({ name, size = 22, strokeWidth = 1.6, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
