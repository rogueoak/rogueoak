import { ImageResponse } from "next/og";
import type { Item } from "@/lib/content";

/**
 * Shared renderer for the per-item Open Graph cards (the 1200x630 image a crawler
 * shows when a tool/product link is pasted into iMessage, Slack, LinkedIn, etc.).
 * Each card is built from the same `Item` record that drives the page, so the
 * preview can never drift from the page copy. The palette is the Rogue Oak dark
 * banner (navy base, amber/green spark), as flat literals so the card matches the
 * site without importing the token CSS (mirrors app/opengraph-image.tsx).
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG_FROM = "#1a2533"; // banner navy
const BG_TO = "#0a0d13"; // deep navy base
const TEXT = "#eaf1f4";
const SUBTLE = "#c9d2da";
const EYEBROW = "#d2a463"; // amber accent
const SPARK_FROM = "#d2a463"; // amber accent
const SPARK_TO = "#5fb98a"; // banner green

/** Render the OG card for one tool/product. `eyebrow` is the section label. */
export function itemOgResponse(item: Item, eyebrow: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
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
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: EYEBROW,
            marginTop: 28,
          }}
        >
          {eyebrow.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
            color: TEXT,
            letterSpacing: "-0.02em",
            marginTop: 12,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 500,
            color: SUBTLE,
            marginTop: 22,
            maxWidth: 1000,
            lineHeight: 1.3,
          }}
        >
          {item.pitch}
        </div>
        {item.status ? (
          <div
            style={{ display: "flex", fontSize: 24, color: EYEBROW, marginTop: 26 }}
          >
            {item.status}
          </div>
        ) : null}
      </div>
    ),
    { ...OG_SIZE },
  );
}
