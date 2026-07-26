/**
 * thoughtbuffer.app identity (spec 0012): the second domain served from this same
 * container. Hardcoded on purpose. The Thought Buffer subtree is reached only via
 * the host rewrite in `proxy.ts`, so its base URL is a compile-time constant
 * and nothing here reads the request host. The on-page copy (pitch, benefits,
 * body) is the `thought-buffer` product entry in `content.ts`, read where needed.
 */
export const thoughtBuffer = {
  url: "https://thoughtbuffer.app",
  name: "Thought Buffer",
  tagline: "Think out loud. Keep every thought.",
  description:
    "Hands-free, on-device dictation for capturing your thinking out loud on iPhone and in CarPlay. Your words never leave your phone.",
  // Amber/gold spark is the app's live-recording accent; used to tint the mobile
  // browser chrome. The deep water base matches the theme background.
  themeColor: "#0e1618",
} as const;
