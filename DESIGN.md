# DESIGN.md - Emoji Crowd Runner (PlayStation Inspired)

## Visual Theme & Atmosphere
- **Mood**: Gaming console retail, three-surface channel layout, quiet-authority
- **Density**: Dark, cinematic, premium gaming aesthetic
- **Design Philosophy**: Cyan glow, hover-scale interactions, bold display typography

## Color Palette & Roles

| Name | Hex | Role |
|------|-----|------|
| Background Black | #000000 | Primary background, canvas |
| Neon Cyan | #00f0ff | Primary accent, glow effects, HUD elements |
| Neon Pink | #ff2d95 | Secondary accent, status popups, battle effects |
| Electric Yellow | #ffff00 | Gates, interactive elements |
| Purple Glow | #b44fff | Special effects, power-ups |
| Surface Dark | #1a1a1a | UI panels, cards |
| Text Primary | #ffffff | Main text, high contrast |
| Text Muted | #a0a0a0 | Secondary text, labels |

## Typography Rules

| Role | Font | Weight | Size | Letter Spacing |
|------|------|--------|------|----------------|
| Display (Headings) | 'Geist', sans-serif | 700 | 28px | 0.12em |
| UI Labels | 'Quicksand', sans-serif | 600 | 14px | 0.08em |
| Status Popups | 'Caveat', cursive | 400 | 28px | normal |
| Monospace | 'Geist Mono', monospace | 500 | 12px | 0.06em |

## Component Stylings

### Buttons
- Background: rgba(0, 240, 255, 0.1)
- Border: 1px solid rgba(0, 240, 255, 0.3)
- Color: #00f0ff
- Padding: 8px 16px
- Border-radius: 20px
- Hover: scale(1.05), glow intensifies
- Transition: all 0.2s ease

### HUD (Heads-Up Display)
- Position: absolute, top: 10px, left: 50%, transform: translateX(-50%)
- Background: rgba(0, 0, 0, 0.4)
- Border: 1px solid rgba(0, 240, 255, 0.3)
- Color: #00f0ff
- Text-shadow: 0 0 5px #00f0ff
- Font: 'Quicksand', sans-serif, 14px
- Display: flex, gap: 8px

### Status Popup
- Position: absolute, top: 40%, left: 50%, transform: translate(-50%, -50%)
- Background: rgba(0, 0, 0, 0.4)
- Border: 1px solid rgba(255, 45, 149, 0.3)
- Color: #ff2d95 (default) / #ffff00 (gates) / #00f0ff (crowd)
- Text-shadow: 0 0 10px currentColor, 0 0 20px rgba(currentColor, 0.5)
- Font: 'Caveat', cursive, 28px
- Animation: fadeInOut 2s ease-in-out forwards
- White-space: nowrap

### Cards / Panels
- Background: rgba(26, 26, 26, 0.9)
- Border: 1px solid rgba(0, 240, 255, 0.2)
- Border-radius: 12px
- Padding: 12px 24px
- Backdrop-filter: blur(12px)

## Layout Principles
- **Grid**: 3-surface channel layout (inspired by PlayStation Store)
- **Spacing scale**: 4px, 8px, 12px, 16px, 24px, 32px
- **Whitespace philosophy**: Cinematic, premium gaming feel
- **Max-width**: 2000px, centered

## Depth & Elevation

| Level | Shadow | Usage |
|-------|--------|-------|
| Surface | 0 1px 3px rgba(0,0,0,0.05) | Cards, panels |
| Hover | 0 0 5px currentColor | Interactive elements |
| Popup | 0 0 10px color, 0 0 20px rgba(color,0.5) | Status messages |
| Glow | 0 0 20px rgba(0,240,255,0.4) | Neon effects |

## Do's and Don'ts

### ✅ Do:
- Use neon glow effects for interactive elements
- Keep typography bold and authoritative
- Maintain high contrast (dark bg + bright accents)
- Use PlayStation-style three-surface layout for menus
- Apply hover-scale (1.05x) to buttons

### ❌ Don't:
- Use light backgrounds (always dark)
- Overuse colors (stick to cyan, pink, yellow, purple)
- Make text small (minimum 14px for UI)
- Forget the "gaming retail" premium feel

## Responsive Behavior
- **Breakpoints**: 320px (mobile), 768px (tablet), 1024px (desktop)
- **Touch targets**: Minimum 44x44px
- **Mobile**: Single-column, simplified HUD
- **Desktop**: Three-surface layout, full HUD

## Agent Prompt Guide
When working on Emoji Crowd Runner UI:
1. Reference this DESIGN.md for color hex codes
2. Use 'Geist' or 'Quicksand' fonts
3. Apply neon glow effects (text-shadow, box-shadow)
4. Maintain dark, gaming-retail aesthetic
5. Test with cyan (#00f0ff) and pink (#ff2d95) accents
6. Keep it premium, bold, PlayStation-inspired!

## Quick Color Reference
- Primary: #00f0ff (Cyan)
- Secondary: #ff2d95 (Pink)
- Gates: #ffff00 (Yellow)
- Power-ups: #b44fff (Purple)
- Background: #000000 (Black)
- Surface: #1a1a1a (Dark gray)

---
*Design inspired by PlayStation. For AI agents building Emoji Crowd Runner UI.*
