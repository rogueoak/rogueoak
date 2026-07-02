import posthog from "posthog-js";
import { analytics } from "@/lib/analytics";
import { isClientAnalyticsEnabled } from "@/lib/analytics-env";

/**
 * Whether PostHog should capture in this browser: only a production build served
 * from the real (non-local) host. Suppresses `next dev` and any local production
 * build, so local runs never pollute the live dashboard.
 */
export function clientAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return isClientAnalyticsEnabled({
    nodeEnv: process.env.NODE_ENV,
    hostname: window.location.hostname,
  });
}

/**
 * Idempotent browser init for PostHog. Called at MODULE scope by the provider so
 * the SDK is loaded before any React effect fires: child effects run before
 * parent effects, so an effect-based init let the first `$pageview` capture run
 * pre-init and be silently dropped.
 *
 * A no-op when analytics is disabled (local runs) or during SSR - so locally the
 * SDK never loads, nothing is sent, and no capture warnings fire. The `started`
 * latch means repeated calls only init once.
 */
let started = false;

export function initPostHogBrowser(): typeof posthog {
  if (started || !clientAnalyticsEnabled()) return posthog;
  started = true;
  posthog.init(analytics.key, {
    api_host: analytics.host,
    ui_host: analytics.uiHost,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage",
  });
  return posthog;
}

export { posthog };
