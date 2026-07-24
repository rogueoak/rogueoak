import { ImageResponse } from "next/og";
import { logoDataUri } from "@/components/og-card";
import { site } from "@/lib/site";

// Node runtime so we can read the wordmark SVG off disk.
export const runtime = "nodejs";

// The branded card crawlers render for the link preview (home + the section pages
// that inherit this root OG: about, tools, products, contact).
export const alt = site.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rogue Oak dark palette (the navy banner colors), as flat literals so the card
// matches the site without importing the token CSS.
const BG_FROM = "#1a2533"; // banner navy
const BG_TO = "#0a0d13"; // deep navy base
const TEXT = "#eaf1f4";
const SUBTLE = "#c9d2da";
const SPARK_FROM = "#d2a463"; // amber accent
const SPARK_TO = "#5fb98a"; // banner green

// The Rogue Oak wordmark is 560x200; render it large, keeping that aspect ratio.
const LOGO_W = 560;
const LOGO_H = 200;

export default function OpengraphImage() {
  const logo = logoDataUri("/rogueoak-logo.svg");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "90px",
          backgroundImage: `linear-gradient(135deg, ${BG_FROM}, ${BG_TO})`,
        }}
      >
        <div
          style={{
            width: 88,
            height: 8,
            borderRadius: 4,
            backgroundImage: `linear-gradient(90deg, ${SPARK_FROM}, ${SPARK_TO})`,
          }}
        />
        {logo ? (
          <img src={logo} width={LOGO_W} height={LOGO_H} alt={site.name} style={{ marginTop: 24 }} />
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 700,
              color: TEXT,
              letterSpacing: "-0.02em",
              marginTop: 32,
            }}
          >
            {site.name}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 500,
            color: SUBTLE,
            marginTop: 20,
          }}
        >
          {site.title}
        </div>
      </div>
    ),
    { ...size },
  );
}
