# Campus Match - Design System

## Overview

A campus dating matching platform with Apple-inspired design + Liquid Glass effects.

- **Style**: Clean, premium, modern
- **Atmosphere**: Light, airy, trustworthy
- **Target**: Chinese university students (18-25)

---

## Color Palette

### Primary Colors
| Name | Value | Usage |
|------|-------|-------|
| `--bg-primary` | `#FFFFFF` | Main background |
| `--bg-secondary` | `#F5F5F7` | Secondary background |
| `--text-primary` | `#1D1D1F` | Primary text |
| `--text-secondary` | `#86868B` | Secondary text |
| `--accent-blue` | `#0071E3` | Buttons, links, active states |
| `--accent-pink` | `#FF2D55` | Like/heart actions |

### Liquid Glass Effect
| Name | Value | Usage |
|------|-------|-------|
| `--glass-bg` | `rgba(255, 255, 255, 0.72)` | Glass background |
| `--glass-border` | `rgba(255, 255, 255, 0.4)` | Glass border |
| `--glass-blur` | `20px` | Backdrop blur amount |
| `--glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.08)` | Glass shadow |

---

## Typography

### Font Family
- **Primary**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`
- **Display**: `"SF Pro Display", -apple-system, sans-serif`

### Type Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero | 48px | 700 | Main headlines |
| H1 | 32px | 600 | Page titles |
| H2 | 24px | 600 | Section headers |
| H3 | 20px | 600 | Card titles |
| Body | 16px | 400 | Main text |
| Small | 14px | 400 | Captions, metadata |
| Tiny | 12px | 400 | Tags, badges |

---

## Components

### Buttons

#### Primary Button
```
Background: #0071E3
Text: #FFFFFF
Padding: 12px 24px
Border-radius: 980px (pill shape)
Font-weight: 500
Hover: darken 10%
```

#### Glass Button
```
Background: rgba(255, 255, 255, 0.72)
Backdrop-filter: blur(20px)
Border: 1px solid rgba(255, 255, 255, 0.4)
Text: #1D1D1F
Padding: 12px 24px
Border-radius: 980px
Shadow: 0 8px 32px rgba(0, 0, 0, 0.08)
```

#### Like Button (Pink)
```
Background: #FF2D55
Text: #FFFFFF
Border-radius: 50%
Size: 56px x 56px
Icon: Heart
Shadow: 0 4px 16px rgba(255, 45, 85, 0.3)
```

### Cards

#### Profile Card
```
Background: #FFFFFF
Border-radius: 20px
Overflow: hidden
Shadow: 0 4px 24px rgba(0, 0, 0, 0.06)
Image: aspect-ratio 3:4, object-fit cover
```

#### Glass Card
```
Background: rgba(255, 255, 255, 0.72)
Backdrop-filter: blur(20px)
Border: 1px solid rgba(255, 255, 255, 0.4)
Border-radius: 24px
Padding: 24px
Shadow: 0 8px 32px rgba(0, 0, 0, 0.08)
```

### Inputs

#### Text Input
```
Background: #F5F5F7
Border: none
Border-radius: 12px
Padding: 16px
Font-size: 16px
Focus: ring-2 ring-accent-blue
```

#### Glass Input
```
Background: rgba(255, 255, 255, 0.8)
Backdrop-filter: blur(10px)
Border: 1px solid rgba(255, 255, 255, 0.5)
Border-radius: 16px
Padding: 16px 20px
```

### Navigation

#### Bottom Tab Bar (Glass)
```
Position: fixed bottom
Background: rgba(255, 255, 255, 0.72)
Backdrop-filter: blur(20px)
Border-top: 1px solid rgba(255, 255, 255, 0.4)
Height: 80px (including safe area)
Icons: 24px, #86868B (inactive), #0071E3 (active)
```

---

## Layout

### Spacing Scale
| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

### Container
- Max-width: 480px (mobile-first)
- Padding: 16px (mobile), 24px (tablet+)

### Grid
- Main: Single column (mobile)
- Cards: 2 columns on tablet+

---

## Effects

### Liquid Glass
```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### Card Hover
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}
```

### Button Press
```css
.button:active {
  transform: scale(0.96);
  transition: transform 0.1s;
}
```

---

## Pages

### 1. Home / Discovery
- Full-screen profile cards
- Swipe-like interaction
- Glass bottom action bar (Like/Skip)

### 2. Profile
- Large avatar (circular or rounded)
- Glass info cards
- Edit button (glass style)

### 3. Matches
- List of matched users
- Glass chat preview cards
- Unread badges (pink accent)

### 4. Settings
- Glass section cards
- Toggle switches (iOS style)
- Sign out button (red text)

---

## Do's and Don'ts

### Do
- Use plenty of white space
- Keep text concise and clear
- Use high-quality photos
- Maintain consistent spacing
- Use glass effect for overlays

### Don't
- Don't clutter the interface
- Don't use more than 2 accent colors
- Don't use harsh shadows
- Don't use sharp corners (keep rounded)
- Don't make glass too transparent (< 0.6)

---

## Responsive

### Mobile (Default)
- Single column
- Full-width cards
- Bottom navigation

### Tablet+
- Max-width container
- 2-column card grid
- Side navigation optional

---

## Agent Prompt Guide

When building this project:

1. **Use Tailwind CSS** for styling
2. **Apply glass effect** to overlays, nav bars, and floating cards
3. **Use SF Pro font stack** or system fonts
4. **Keep it light** - white backgrounds, subtle shadows
5. **Make it feel premium** - smooth transitions, careful spacing
6. **Use the pink accent (#FF2D55)** sparingly for like/heart actions only

Key phrases:
- "Apply liquid glass effect"
- "Use Apple-style clean design"
- "Make it feel premium and modern"
- "Use plenty of white space"
