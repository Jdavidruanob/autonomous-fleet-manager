# Fleet Control PUJ Design System

This document is derived from the Lovable prototype and adjusted to match the current repository implementation.

## Current implementation notes

- The frontend shell already uses this visual direction in the current Next.js app.
- The current implementation uses `lucide-react` only for icons. That is a hard repository rule.
- Do not introduce another icon library.
- Do not create an SVG icon asset folder.
- Do not use emoji as icons.
- Dark mode is not implemented in the current app and should not be introduced casually.

## 1. Color palette

Primary color tokens are defined in `src/styles.css`. Hex values below are conversions of the observed OKLCH token values, except colors explicitly hardcoded in components.

| Variable name | Hex value | Semantic meaning | Where used in the UI |
|---|---:|---|---|
| `--background` | <span style="display:inline-block;width:12px;height:12px;background:#FFFFFF;border:1px solid #D5D8DB"></span> `#FFFFFF` | App/page background | `body`, app shell, dialog backgrounds, input backgrounds |
| `--foreground` | <span style="display:inline-block;width:12px;height:12px;background:#0A121F"></span> `#0A121F` | Primary text | Body text, headings, outline buttons |
| `--card` | <span style="display:inline-block;width:12px;height:12px;background:#FFFFFF;border:1px solid #D5D8DB"></span> `#FFFFFF` | Card surface | `Card`, dock surface with `bg-card/95` |
| `--card-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#0A121F"></span> `#0A121F` | Card text | `Card` text color |
| `--popover` | <span style="display:inline-block;width:12px;height:12px;background:#FFFFFF;border:1px solid #D5D8DB"></span> `#FFFFFF` | Popover/menu surface | dropdowns, selects, popovers, hover cards |
| `--popover-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#0A121F"></span> `#0A121F` | Popover/menu text | dropdowns, selects, popovers |
| `--primary` | <span style="display:inline-block;width:12px;height:12px;background:#1D58DC"></span> `#1D58DC` | Primary action, selected/active state | default buttons, active dock item, logo block, stepper active step, progress, focus ring |
| `--primary-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#FCFCFC;border:1px solid #D5D8DB"></span> `#FCFCFC` | Text on primary | primary buttons, active dock item, active stepper |
| `--secondary` | <span style="display:inline-block;width:12px;height:12px;background:#F1F6FC;border:1px solid #D5D8DB"></span> `#F1F6FC` | Secondary surface | search background, table/list hover variants, info panels, filters |
| `--secondary-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#0F1B2D"></span> `#0F1B2D` | Text on secondary | secondary buttons |
| `--muted` | <span style="display:inline-block;width:12px;height:12px;background:#F1F6FC;border:1px solid #D5D8DB"></span> `#F1F6FC` | Muted surface | table hover, skeleton/map loading, progress tracks |
| `--muted-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#5C646F"></span> `#5C646F` | Secondary text | descriptions, subtitles, metadata, placeholders |
| `--accent` | <span style="display:inline-block;width:12px;height:12px;background:#9CD0FF"></span> `#9CD0FF` | Hover/accent surface | outline button hover, ghost hover, dropdown focus, user avatar |
| `--accent-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#06173F"></span> `#06173F` | Text on accent | hover/focused menu items, accent avatar text |
| `--destructive` | <span style="display:inline-block;width:12px;height:12px;background:#DF2225"></span> `#DF2225` | Danger/error/critical state | destructive buttons, critical badges, invalid forms, signal loss |
| `--destructive-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#FCFCFC;border:1px solid #D5D8DB"></span> `#FCFCFC` | Text on destructive | destructive buttons, live badge |
| `--success` | <span style="display:inline-block;width:12px;height:12px;background:#20A04E"></span> `#20A04E` | Success/available/completed | active device badge, completed order badge, success step |
| `--success-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#FCFCFC;border:1px solid #D5D8DB"></span> `#FCFCFC` | Text on success | completed stepper state |
| `--warning` | <span style="display:inline-block;width:12px;height:12px;background:#F2A618"></span> `#F2A618` | Warning/caution/battery | low battery, warning alerts, maintenance warning banner |
| `--warning-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#260F00"></span> `#260F00` | Text on warning | low battery badge, warning banner |
| `--info` | <span style="display:inline-block;width:12px;height:12px;background:#0A8FD1"></span> `#0A8FD1` | Informational/in mission/drone | mission badges, drone icons, info alerts |
| `--info-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#FCFCFC;border:1px solid #D5D8DB"></span> `#FCFCFC` | Text on info | reserved token |
| `--border` | <span style="display:inline-block;width:12px;height:12px;background:#D5D8DB;border:1px solid #999"></span> `#D5D8DB` | Default border | cards, tables, dialogs, separators |
| `--input` | <span style="display:inline-block;width:12px;height:12px;background:#D5D8DB;border:1px solid #999"></span> `#D5D8DB` | Input border | inputs, selects, outline buttons |
| `--ring` | <span style="display:inline-block;width:12px;height:12px;background:#1D58DC"></span> `#1D58DC` | Focus ring | focus-visible states |
| `--sidebar` | <span style="display:inline-block;width:12px;height:12px;background:#0A121F"></span> `#0A121F` | Dark login visual panel | login left side |
| `--sidebar-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#EDF2F9;border:1px solid #D5D8DB"></span> `#EDF2F9` | Text on sidebar | login left side |
| `--sidebar-accent` | <span style="display:inline-block;width:12px;height:12px;background:#192230"></span> `#192230` | Sidebar accent surface | sidebar component states |
| `--sidebar-accent-foreground` | <span style="display:inline-block;width:12px;height:12px;background:#EDF2F9;border:1px solid #D5D8DB"></span> `#EDF2F9` | Sidebar accent text | login eyebrow text |
| `--sidebar-border` | <span style="display:inline-block;width:12px;height:12px;background:#202938"></span> `#202938` | Sidebar borders | login left panel border pill |
| `leaflet-container background` | <span style="display:inline-block;width:12px;height:12px;background:#EAEFF5;border:1px solid #D5D8DB"></span> `#EAEFF5` | Map loading/background | Leaflet container |
| hardcoded map route | <span style="display:inline-block;width:12px;height:12px;background:#1D4ED8"></span> `#1D4ED8` | Campus route/highlight and legend mission color | `CampusMap` polyline/circle, dashboard legend |
| hardcoded active dot | <span style="display:inline-block;width:12px;height:12px;background:#16A34A"></span> `#16A34A` | Map active device dot | `statusDotColor("activo")`, dashboard legend |
| hardcoded warning dot | <span style="display:inline-block;width:12px;height:12px;background:#D97706"></span> `#D97706` | Map low-battery dot | `statusDotColor("bateria_baja")`, dashboard legend |
| hardcoded critical dot | <span style="display:inline-block;width:12px;height:12px;background:#DC2626"></span> `#DC2626` | Map blocked/signal-lost dot | `statusDotColor("bloqueado" | "sin_senal")`, dashboard legend |
| overlay black | <span style="display:inline-block;width:12px;height:12px;background:#000000"></span> `#000000` at 80% | Modal/sheet/drawer overlay | `bg-black/80` |
| white | <span style="display:inline-block;width:12px;height:12px;background:#FFFFFF;border:1px solid #D5D8DB"></span> `#FFFFFF` | Map marker border/live dot | marker HTML border, live indicator dot |

Observed opacity variants must use token opacity utilities, not new hex colors: `bg-primary/10`, `bg-primary/15`, `bg-primary/20`, `hover:bg-primary/90`, `hover:bg-primary/80`, `bg-secondary/30`, `bg-secondary/40`, `hover:bg-secondary/50`, `hover:bg-secondary/80`, `bg-muted/50`, `hover:bg-muted/50`, `hover:bg-muted/60`, `bg-accent/50`, `bg-destructive/5`, `bg-destructive/10`, `bg-destructive/15`, `border-destructive/20`, `border-destructive/30`, `border-destructive/40`, `border-destructive/50`, `hover:bg-destructive/90`, `hover:bg-destructive/80`, `bg-success/10`, `bg-success/15`, `border-success/30`, `bg-warning/10`, `bg-warning/20`, `border-warning/40`, `bg-info/10`, `bg-info/15`, `border-info/30`, `bg-card/95`, `bg-background/60`, `bg-background/80`, `text-sidebar-foreground/60`, `text-sidebar-foreground/70`, `text-sidebar-accent-foreground/70`, `shadow-black/5`.

Dark mode tokens exist in `src/styles.css` but no route toggles `.dark` in the prototype. Do not introduce dark mode behavior unless the app implements the `.dark` root class.

## 2. Typography

Font family:

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
```

The app also loads Inter from Google Fonts in `src/routes/__root.tsx`.

Observed size scale:

| Tailwind class | Size | Use case observed |
|---|---:|---|
| `text-[10px]` | 10px | demo labels, device type chips, kbd hint, live badge, camera metadata |
| `text-xs` | 12px | badges, labels, metadata, helper text, table metadata, tooltip |
| `text-[0.8rem]` | 12.8px | calendar caption label |
| `text-sm` | 14px | default body in components, buttons, table, forms, descriptions |
| `text-base` | 16px | raw input/textarea text before `md:text-sm` |
| `text-lg` | 18px | dialog titles |
| `text-xl` | 20px | login form heading, 404 subheading |
| `text-2xl` | 24px | page headings |
| `text-3xl` | 30px | login marketing panel headline |
| `text-7xl` | 72px | 404 heading only |

Observed weight scale:

| Class | Use |
|---|---|
| `font-normal` | muted secondary text and normal labels |
| `font-medium` | buttons, menu items, status badges, metric labels |
| `font-semibold` | page headings, cards, KPI values, badge defaults |
| `font-bold` | compact logo blocks, live badge, device type cells |

Line height conventions:

| Class | Use |
|---|---|
| `leading-none` | card titles, dialog titles, calendar cells |
| `leading-tight` | login marketing headline |
| `leading-snug` | alert popover messages |
| `leading-relaxed` | login marketing paragraph and service card descriptions |
| default Tailwind line-height | most labels, body text, controls |

Other text conventions observed: `tracking-tight` for headings, `tracking-wide uppercase` for compact labels and KPI labels, `tabular-nums` for counters and telemetry, `font-mono` for IDs, coordinates, and technical strings.

## 3. Spacing scale

Base unit: Tailwind spacing unit `1 = 0.25rem = 4px`.

Observed spacing values:

| Class | px | Use case observed |
|---|---:|---|
| `0` | 0 | border removal, zero padding, no last border |
| `0.5` | 2 | tiny top/margin offsets |
| `1` | 4 | menu padding, small offsets, dock item indicator offset |
| `1.5` | 6 | badge padding, menu item padding, compact gaps |
| `2` | 8 | small gaps, button/menu padding, compact cards |
| `2.5` | 10 | badge horizontal padding, telemetry panel padding |
| `3` | 12 | card/filter padding, form control horizontal padding, compact layout gaps |
| `3.5` | 14 | small icon sizes/positions |
| `4` | 16 | standard page horizontal padding, card padding, gaps |
| `5` | 20 | icon sizes, page section spacing, dock bottom offset |
| `6` | 24 | page top padding, modal/card padding, form vertical sections |
| `7` | 28 | stepper circles, logo/avatar squares |
| `8` | 32 | medium icons, large button horizontal padding, compact dialog icon |
| `9` | 36 | standard control height and icon button size |
| `10` | 40 | large button/control/icon size, stub card padding |
| `11` | 44 | navigation dock item size |
| `12` | 48 | large device icons, login panel padding |
| `14` | 56 | header height |
| `24` | 96 | app bottom padding to clear dock |
| `32` | 128 | login decorative orb offset |
| `96` | 384 | login decorative orb size |

Arbitrary spacing values observed:

| Class/value | px | Use |
|---|---:|---|
| `min-h-[60px]` | 60 | textarea minimum height |
| `w-[100px]` | 100 | drawer handle |
| `w-[110px]` | 110 | orders table ID column |
| `w-[180px]` | 180 | filter select width |
| `min-w-[220px]` | 220 | search filter minimum width |
| `h-[420px]` | 420 | device detail map |
| `h-[460px]` | 460 | dashboard map and fleet list |
| `max-w-[1400px]` | 1400 | main app content max width |
| `-left-[21px]` | -21 | order timeline dot position |

Rules:

- Use `gap-2` or `gap-3` for compact inline controls.
- Use `gap-4` for card grids and two-column page sections.
- Use `space-y-4`, `space-y-5`, or `space-y-6` for vertical page rhythm.
- Use `p-3` for filter bars/list rows, `p-4` for standard cards, and `p-6` for forms/modals.
- Use `px-4 pt-6 pb-24` for app main content.
- Use `pb-24` on main app pages because the dock is fixed at the bottom.

## 4. Border radius scale

Theme radius:

```css
--radius: 0.5rem;
--radius-sm: calc(var(--radius) - 4px); /* 4px */
--radius-md: calc(var(--radius) - 2px); /* 6px */
--radius-lg: var(--radius);             /* 8px */
--radius-xl: calc(var(--radius) + 4px); /* 12px */
--radius-2xl: calc(var(--radius) + 8px);/* 16px */
```

Observed radius usage:

| Class | px | Component type |
|---|---:|---|
| `rounded-sm` | 4 | close buttons, menu items, resizable handle, chart markers |
| `rounded-md` | 6 | buttons, inputs, selects, badges, logo blocks, compact panels |
| `rounded-lg` | 8 | map containers, metric icons, modal success QR block, stub icon background |
| `rounded-xl` | 12 | cards, dock items, service cards |
| `rounded-2xl` | 16 | floating navigation dock container |
| `rounded-full` | fully rounded | status dots, avatars, stepper circles, live badge, progress tracks |
| `rounded-t-[10px]` | 10 | drawer top corners |
| `rounded-[2px]` | 2 | chart indicator swatches |

## 5. Shadows

Observed shadow classes and values:

| Class/value | Box shadow | Usage rules |
|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | form controls, outline/secondary/destructive buttons, active dock item |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | default button, card, tabs active state |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | select/popover/hover-card content |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | dock container, dialogs, sheets, dropdowns, toast |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | chart tooltip |
| `shadow-black/5` | black at 5% tint applied to shadow color | dock container |
| `shadow-[0_0_0_1px_var(--sidebar-border)]` | one-pixel outline shadow | sidebar menu button outline variant |
| `shadow-[0_0_0_1px_var(--sidebar-accent)]` | one-pixel outline shadow | sidebar menu button hover |
| inline marker shadow | `0 1px 4px rgba(0,0,0,.3)` | Leaflet divIcon markers only |
| `shadow-none` | none | sidebar input |

Usage rules:

- Use `shadow` only for elevated base surfaces like `Card` and primary buttons.
- Use `shadow-sm` for controls.
- Use `shadow-lg` for overlays, dock, and toasts.
- Do not add decorative shadows beyond the observed classes.

## 6. Component patterns

### Button

Purpose: command actions, navigation commands, destructive operations, icon buttons.

Required props / variants: `variant`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; `size`: `default`, `sm`, `lg`, `icon`; optional `asChild`.

Base classes:

```txt
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

Variants:

```txt
default: bg-primary text-primary-foreground shadow hover:bg-primary/90
destructive: bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90
outline: border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground
secondary: bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80
ghost: hover:bg-accent hover:text-accent-foreground
link: text-primary underline-offset-4 hover:underline
```

Sizes:

```txt
default: h-9 px-4 py-2
sm: h-8 rounded-md px-3 text-xs
lg: h-10 rounded-md px-8
icon: h-9 w-9
```

States: hover as defined above; focus uses `focus-visible:ring-1 focus-visible:ring-ring`; disabled uses `disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed`. No loading state is defined in the prototype.

Do: include Lucide icons inside action buttons when the prototype does. Use `variant="destructive"` for cancel/critical actions. Use `outline` for secondary dialog actions.

Do not: create new button colors, new heights, emoji icons, or text-only icon substitutes.

### Badge / status indicator

Purpose: compact status labels and counters.

Base classes:

```txt
inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

Variants:

```txt
default: border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80
secondary: border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80
destructive: border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80
outline: text-foreground
```

Status badges add:

```txt
gap-1.5 font-medium
```

with a Lucide icon:

```txt
h-3 w-3
```

States: default and hover only for generic badge variants. Status badges are display-only.

Do: use `Badge variant="outline"` plus the exact status classes from section 7.

Do not: use a badge as a button unless it receives keyboard/focus handling.

### Card

Purpose: grouped surface for KPIs, maps, forms, device panels, empty states.

Base classes:

```txt
rounded-xl border bg-card text-card-foreground shadow
```

Common content classes observed: `p-4`, `p-6`, `p-0 overflow-hidden`, `border-b`, `bg-secondary/40`.

States: cards themselves do not have hover unless implemented as a selectable service card.

Do: use cards for framed information groups.

Do not: nest decorative cards inside cards unless the prototype already does for a functional framed element like QR content.

### Table row

Purpose: tabular data in order log.

Table base:

```txt
w-full caption-bottom text-sm
```

Row base:

```txt
border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted
```

Header cell:

```txt
h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]
```

Body cell:

```txt
p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]
```

Order rows add `cursor-pointer` and open a side sheet.

Do: use `font-mono text-xs` for IDs.

Do not: remove `hover:bg-muted/50` from clickable rows.

### Form input

Purpose: text, email, password, date, time input.

Input classes:

```txt
flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
```

Textarea classes:

```txt
flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
```

Select trigger classes:

```txt
flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1
```

Error input classes:

```txt
border-destructive focus-visible:ring-destructive
```

Do: validate institutional email inline after user interaction and show `text-xs text-destructive`.

Do not: use taller inputs than `h-9` unless using `Textarea`.

### Modal

Purpose: confirmation, create-success QR, add-device placeholder.

Overlay:

```txt
fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

Content:

```txt
fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg
```

Close button:

```txt
absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none
```

Do: use `AlertDialog` for destructive or mission-interrupting actions.

Do not: perform cancel/return actions without confirmation.

### Alert / toast notification

Purpose: inline blocking/warning banners and transient success/info messages.

Alert base:

```txt
relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7
```

Destructive alert variant:

```txt
border-destructive/50 text-destructive
```

Order form banner:

```txt
flex items-start gap-2 rounded-md border px-3 py-2 text-sm
```

Banner destructive:

```txt
border-destructive/30 bg-destructive/10 text-destructive
```

Banner warning:

```txt
border-warning/40 bg-warning/10 text-warning-foreground
```

Toast classes:

```txt
toast: group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg
description: group-[.toast]:text-muted-foreground
actionButton: group-[.toast]:bg-primary group-[.toast]:text-primary-foreground
cancelButton: group-[.toast]:bg-muted group-[.toast]:text-muted-foreground
```

Do: use `toast.success(...)` for successful actions observed in the prototype.

Do not: style toast variants outside the Sonner class map.

### Navigation dock item

Purpose: primary app navigation.

Dock container:

```txt
pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center
```

Dock surface:

```txt
pointer-events-auto flex items-end gap-1 rounded-2xl border bg-card/95 backdrop-blur px-2 py-1.5 shadow-lg shadow-black/5
```

Item base:

```txt
group relative grid h-11 w-11 place-items-center rounded-xl transition-all
```

Active item:

```txt
bg-primary text-primary-foreground shadow-sm scale-105
```

Inactive item:

```txt
text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-110
```

Emphasized inactive item:

```txt
text-primary
```

Active indicator:

```txt
absolute -bottom-1 h-1 w-1 rounded-full bg-primary-foreground
```

Do: use Lucide icons only, with `h-5 w-5`.

Do not: add text labels inside the dock; labels are tooltips.

### KPI metric card

Purpose: dashboard summary metrics.

Card container:

```txt
p-4
```

Layout:

```txt
flex items-start justify-between
```

Label:

```txt
text-xs uppercase tracking-wide text-muted-foreground font-medium
```

Value:

```txt
text-3xl font-semibold mt-2 tabular-nums
```

Icon cell:

```txt
grid h-9 w-9 place-items-center rounded-lg
```

Observed icon tints:

```txt
text-info bg-info/10
text-success bg-success/10
text-destructive bg-destructive/10
text-primary bg-primary/10
```

### Device status indicator

Purpose: device operational state.

Use `DeviceStatusBadge` classes exactly:

```txt
Badge variant="outline" className="gap-1.5 font-medium {statusClass}"
Icon className="h-3 w-3"
```

Status classes are documented in section 7.

## 7. Status color system

Device status mapping:

| Status | Prototype key | Color classes | Map dot hex | Icon name (Lucide) |
|---|---|---|---:|---|
| Available / Active | `activo` | `bg-success/15 text-success border-success/30` | `#16A34A` | `CheckCircle2` |
| In mission | `mision` | `bg-info/15 text-info border-info/30` | `#1D4ED8` | `Activity` |
| Blocked | `bloqueado` | `bg-destructive/15 text-destructive border-destructive/30` | `#DC2626` | `Ban` |
| Maintenance required | derived in devices page when `kmTotal >= 300`, `flightHours >= 50`, or `status === "bloqueado"` | banner: `bg-destructive/10 border-destructive/20 text-destructive`; icon container uses inherited destructive text | no separate map color; blocked uses `#DC2626` | `AlertTriangle`; maintenance action uses `Wrench` |
| Low battery | `bateria_baja` | `bg-warning/20 text-warning-foreground border-warning/40` | `#D97706` | `BatteryLow` |
| Signal lost | `sin_senal` | `bg-destructive/15 text-destructive border-destructive/30` | `#DC2626` | `WifiOff` |

Order status mapping:

| Status | Prototype key | Color classes | Icon name (Lucide) |
|---|---|---|---|
| Order: Pending | `pendiente` | `bg-muted text-muted-foreground border-border` | `Clock` |
| Order: In progress | `en_curso` | `bg-info/15 text-info border-info/30` | `PlayCircle` |
| Order: Completed | `completada` | `bg-success/15 text-success border-success/30` | `CheckCircle2` |
| Order: Cancelled | `cancelada` | `bg-destructive/15 text-destructive border-destructive/30` | `XCircle` |

Alert dot mapping:

```txt
critical: bg-destructive
warning: bg-warning
info: bg-info
```

## 8. Layout rules

Grid system observed:

```txt
dashboard KPI: grid gap-3 sm:grid-cols-2 lg:grid-cols-4
dashboard main: grid gap-4 lg:grid-cols-[1fr_340px]
devices index: grid gap-4 sm:grid-cols-2 lg:grid-cols-3
new order service cards: grid sm:grid-cols-2 gap-4
new order form fields: grid sm:grid-cols-2 gap-4
login: min-h-screen grid lg:grid-cols-2
```

Page max-width:

```txt
main shell: mx-auto max-w-[1400px] px-4 pt-6 pb-24
new order: max-w-3xl mx-auto
login card: w-full max-w-md
dialogs: w-full max-w-lg
```

Header:

```txt
sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
```

Main content area:

```txt
mx-auto max-w-[1400px] px-4 pt-6 pb-24
```

Navigation dock dimensions:

```txt
container: fixed inset-x-0 bottom-5 z-50
surface: px-2 py-1.5 gap-1 rounded-2xl
item: h-11 w-11 rounded-xl
icon: h-5 w-5
active indicator: h-1 w-1
```

Responsive behavior:

- `sm:grid-cols-2` for card/form two-column layouts.
- `lg:grid-cols-2` for login split layout.
- `lg:grid-cols-[1fr_340px]` for dashboard map plus fleet list.
- `lg:grid-cols-3` for device cards.
- Header search is hidden below `md` with `hidden md:block`.
- Login visual panel is hidden below `lg` with `hidden lg:flex`.
- Dialog footers stack mobile-first with `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`.

## 9. Navigation pattern

The app uses a fixed bottom floating dock, not a sidebar, for the implemented app shell.

Items:

| Route | Label | Icon | Rule |
|---|---|---|---|
| `/` | Panel | `LayoutDashboard` | always visible |
| `/orders/new` | Crear orden | `PlusCircle` | always visible, emphasized when inactive |
| `/orders` | Bitácora | `ClipboardList` | always visible |
| `/devices` | Dispositivos | `Cpu` | always visible |
| `/reports` | Reportes | `BarChart3` | always visible |
| `/users` | Usuarios | `Users` | visible only when `role === "administrador"` |
| `/settings` | Configuración | `SettingsIcon` | always visible |

Active state logic:

```ts
const active = to === "/" ? path === "/" : path.startsWith(to);
```

Active appearance:

```txt
bg-primary text-primary-foreground shadow-sm scale-105
```

Inactive appearance:

```txt
text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-110
```

Tooltip behavior:

```txt
TooltipProvider delayDuration={120}
TooltipContent side="top" sideOffset={8} className="text-xs"
```

Tooltip surface classes:

```txt
z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
```

## 10. Interaction patterns

Hover transitions:

- Buttons: `transition-colors`, hover colors defined by variant.
- Dock items: `transition-all`, hover scales to `hover:scale-110`; active is `scale-105`.
- Clickable list rows: `hover:bg-secondary/50 transition-colors`.
- Table rows: `transition-colors hover:bg-muted/50`.
- Menu items: `transition-colors focus:bg-accent focus:text-accent-foreground`.
- Service cards: `transition-all hover:border-primary/50 hover:shadow-sm`.
- Dialog close: `transition-opacity hover:opacity-100`.

Durations/easing:

- Dialog and alert dialog content uses `duration-200`.
- Sheet uses `transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500`.
- Sidebar transitions use `duration-200 ease-linear`.
- Live indicator uses custom CSS animation `live-pulse 1.4s ease-in-out infinite`.

Focus states:

```txt
buttons: focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
inputs: focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
selects: focus:outline-none focus:ring-1 focus:ring-ring
badges: focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
dialog close: focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

Loading states:

- `Skeleton`: `animate-pulse rounded-md bg-primary/10`.
- `CampusMap` before dynamic Leaflet import: `w-full rounded-lg bg-muted animate-pulse`.
- No spinner component is used.
- Buttons have no loading variant.

Empty states:

Stub pages use:

```txt
Card className="p-10 border-dashed"
icon: grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground mb-4
title: font-medium
description: text-sm text-muted-foreground mt-2
```

Add-device unimplemented dialog uses:

```txt
text-sm text-muted-foreground py-6 text-center border border-dashed rounded-md
```

Error states in forms:

- Email validation uses inline text after blur/touch or while typing in order form.
- Invalid input border/ring:

```txt
border-destructive focus-visible:ring-destructive
```

- Error text:

```txt
flex items-center gap-1 text-xs text-destructive
```

- Error icon: `AlertCircle` or `AlertTriangle` with `h-3 w-3`.

## 11. Rules for developers

1. Use only the color tokens and hardcoded map/status hex values documented in section 1. Do not introduce additional blues, greens, reds, grays, or map colors.
2. Use `Button` variants exactly as implemented: `default` for primary submit/create actions, `outline` for secondary dialog/navigation actions, `ghost` for low-emphasis navigation, `destructive` for cancel/critical actions, `secondary` for neutral filled actions, and `link` only for inline text links.
3. Any action that interrupts or cancels a mission/order must use `AlertDialog`. The prototype uses confirmation for `Forzar retorno a base` and `Cancelar orden actual`.
4. Form validation must be inline for field-specific errors. Use `border-destructive focus-visible:ring-destructive` on the field and `text-xs text-destructive` helper text with a Lucide warning icon.
5. Use Sonner toast notifications for completed transient actions. The prototype uses `toast.success(...)` for order creation, reconnection, return-to-base, cancellation, and maintenance scheduling.
6. Functional icons must be from `lucide-react`. Do not use emojis as functional icons.
7. Use status badges through the mappings in section 7. Do not freestyle badge colors.
8. Keep app pages inside the shell spacing: `mx-auto max-w-[1400px] px-4 pt-6 pb-24`.
9. Preserve the fixed bottom navigation dock. Do not replace it with a sidebar in the implemented app unless a new prototype explicitly changes navigation.
10. Use `font-mono` for order IDs, device IDs, coordinates, and technical stream URLs.
11. Use `tabular-nums` for KPI values, percentages, counters, and telemetry numbers.
12. Accessibility minimums: icon-only buttons need `aria-label`; decorative icons must use `aria-hidden`; dialogs must use Radix `Dialog`/`AlertDialog`; disabled controls must use actual `disabled`; preserve visible focus rings.

## 12. What NOT to do

- Do not invent new color tokens or replace semantic tokens with arbitrary hex values.
- Do not use gradients or decorative blobs except the existing login-only `bg-primary/20 blur-3xl` decorative circle.
- Do not add marketing hero layouts inside the authenticated app.
- Do not create new navigation locations outside the dock pattern without updating the dock item list.
- Do not use rounded pills for primary layout containers; cards use `rounded-xl`, dock uses `rounded-2xl`, badges/status dots use `rounded-full`.
- Do not use emoji icons or custom SVG icons when a Lucide icon exists.
- Do not make destructive actions one-click.
- Do not add loading spinners; use the observed skeleton/pulse patterns unless the prototype adds a spinner.
- Do not create new button sizes beyond `h-8`, `h-9`, `h-10`, and `h-9 w-9`.
- Do not remove `pb-24` from app main content; the fixed dock needs that space.
- Do not use dark mode unless `.dark` is explicitly applied by the application.
- Do not treat prototype toasts/actions as persisted behavior. Visual behavior is documented here; persistence belongs to application logic.
