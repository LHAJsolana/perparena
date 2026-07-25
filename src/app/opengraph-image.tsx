import { ImageResponse } from "next/og";
import { appConfig } from "@/lib/config/app-config";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#060a12",
        color: "#eaf1f8",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "2px solid #2d3d52",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          padding: 64,
          width: 980,
        }}
      >
        <div style={{ color: "#2dd4bf", fontSize: 42, fontWeight: 700 }}>
          {appConfig.productName}
        </div>
        <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1 }}>
          Simulated competition analytics
        </div>
        <div style={{ color: "#9cabbe", fontSize: 30 }}>
          Risk-adjusted scoring foundation
        </div>
      </div>
    </div>,
    size,
  );
}
