# Every Wall Falls — App Store Assets

Icon and splash assets for publishing **Every Wall Falls** with [Median](https://median.co).
The artwork matches the in-game look: dark carved stone, bronze-gold accents, and a
breached battlement glowing with ember — the wall, falling.

Live copies (handy for pasting URLs into the Median dashboard):
`https://bagelarcade.com/app-assets/<filename>`

## Files

| File | Size | Alpha | Use |
|------|------|-------|-----|
| `icon-1024.png` | 1024×1024 | No (opaque) | **App icon** for both iOS and Android. Full-bleed, square, no transparency, no rounded corners (the OS masks it). Upload this as the main icon. |
| `icon-android-foreground.png` | 1024×1024 | Yes | Optional **Android adaptive-icon foreground**. Emblem sits inside the safe zone; pair it with the background color below. |
| `splash-dark.png` | 2048×2048 | No | **Splash / launch screen — dark mode.** Full image, centered. |
| `splash-light.png` | 2048×2048 | No | **Splash / launch screen — light mode.** |
| `splash-logo-transparent.png` | 2048×2048 | Yes | Alternative splash for Median's "centered logo + background color" mode. Set the background to the colors below. |

## Colors

| Purpose | Hex |
|---------|-----|
| Dark background (splash / adaptive icon bg / status bar) | `#141416` |
| Deepest vignette tone (icon backdrop) | `#0c0c0d` |
| Light splash background | `#e2d7bf` |
| Bronze / gold accent | `#c9a860` |
| Cream engraved text | `#e6e0d2` |

## Plugging into Median

- **App Icon:** upload `icon-1024.png`. Median generates every iOS and Android size from it.
- **Android adaptive icon (optional):** foreground = `icon-android-foreground.png`,
  background color = `#141416`.
- **Splash screen:** use `splash-dark.png` for dark mode and `splash-light.png` for light mode.
  If Median asks for a logo + solid color instead of a full image, use
  `splash-logo-transparent.png` with background `#141416` (dark) / `#e2d7bf` (light).

## Regenerating

These are rendered from vector definitions in `_source/` at exact pixel sizes, so they can be
re-exported crisply at any resolution. See `_source/build.js`.
