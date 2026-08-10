import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const iconBackground = "#1f56d8";
const iconForeground = "#ffffff";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: iconBackground,
          borderRadius: 36,
        }}
      >
        <svg width="112" height="112" viewBox="0 0 32 32" fill="none">
          <path
            d="M7.5 8.5l5-5 10 10-5 5-10-10Z"
            stroke={iconForeground}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 16.5 7 25M4.5 26h7"
            stroke={iconForeground}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
