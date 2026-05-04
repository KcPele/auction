import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #f5d580 0%, #e8b755 100%)",
          color: "#0A0A0B",
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderRadius: 36,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
