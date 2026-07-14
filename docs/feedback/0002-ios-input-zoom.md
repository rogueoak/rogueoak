# 0002 - Subscribe inputs auto-zoom on iOS

Source: developer report - the subscribe fields auto-zoom when tapped on iOS.

## Symptom

Tapping the email or name field on the subscribe form (home page and `/subscribe`) made mobile
Safari zoom the whole page in, a jarring shift that then needs a manual zoom-out.

## Root cause

iOS Safari auto-zooms to a focused text input whenever that input's computed `font-size` is below
**16px**. Canopy's `Input` (seeds) defaults to `text-sm` (0.875rem / 14px), so every field on the
site inherited the sub-16px size and tripped the zoom. Not a bug in our code so much as a mobile
platform rule the design-system default did not account for.

## Fix

Pin the visible subscribe inputs to 16px with `className="text-base"` (roots `--text-base` = 1rem /
16px), which tailwind-merge applies over Canopy's `text-sm`. At exactly 16px iOS no longer zooms.
The hidden honeypot input is never focused, so it is left alone.

## Learning

**Interactive text inputs must render at font-size >= 16px on mobile, or iOS Safari auto-zooms on
focus.** This is a general web rule that outlives this feature, so it is recorded as a Trellis
web-app convention (so every rogueoak web app inherits it) and in `overview/learnings.md`. When a
design-system input defaults below 16px, bump it at the app layer.
