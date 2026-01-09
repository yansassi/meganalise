# System Design Specification: Meganalise Pro

This document defines the new design system for the platform, based on the provided reference model.

## 1. Global Design Tokens

### 1.1 Color Palette
The system uses a vibrant, modern palette with high contrast and dark mode support.

| Token | Hex Value | Usage |
|-------|-----------|-------|
| **Primary** | `#6C5DD3` | Brand color, Active states, Primary buttons, Glow effects |
| **Secondary** | `#FF754C` | Accents, Call to actions |
| **Sidebar BG** | `#0F1235` | Main navigation sidebar background |
| **BG Light** | `#F5F6FA` | Main app background (Light Mode) |
| **BG Dark** | `#0F172A` | Main app background (Dark Mode) |
| **Card Light** | `#FFFFFF` | Component background (Light Mode) |
| **Card Dark** | `#1E293B` | Component background (Dark Mode) |

### 1.2 Typography
**Font Family:** `Poppins`, sans-serif.

*   **Headings:** Bold (`font-bold`), often with `tracking-tight`.
*   **Body:** Regular or Medium.
*   **Labels/Captions:** Uppercase, `text-[10px]`, `font-bold`, `tracking-widest`.
*   **Numbers (Stats):** Large, bold (`text-3xl font-bold`).

### 1.3 Shapes & Spacing
*   **Border Radius:**
    *   **Standard Component:** `rounded-3xl` (e.g., Cards, Tables)
    *   **Interactive Elements:** `rounded-2xl` (e.g., Sidebar links, Inputs)
    *   **Buttons/Icons:** `rounded-xl` or `rounded-full`
*   **Shadows:**
    *   `shadow-soft`: `0 10px 40px -10px rgba(0,0,0,0.05)` (General depth)
    *   `shadow-glow`: `0 0 20px rgba(108, 93, 211, 0.3)` (Primary active states)

## 2. Layout Structure

### 2.1 Main Shell
*   **Desktop:** Fixed Sidebar (Left, 288px/`w-72`) + Scrollable Main Content (Right).
*   **Mobile:** Hidden sidebar (hamburger menu likely needed), full width content.
*   **Background:** `bg-background-light` (Light) / `bg-background-dark` (Dark).

### 2.2 Header
*   **Height:** `py-6` (approx 80-100px total).
*   **Content:**
    *   Left: Page Title + Subtitle.
    *   Center: Search Bar.
    *   Right: Theme Toggle, Notification Bell, User Profile.

## 3. Component Details

### 3.1 Sidebar (Navigation)
A dark, premium sidebar with glow effects.

*   **Container:** `bg-sidebar-bg`, `w-72`, fixed height.
*   **Logo Area:** `p-8`. Logo is a rounded square (`rounded-xl`) with Primary BG.
*   **Nav Links:**
    *   Shape: `rounded-2xl`.
    *   Padding: `px-4 py-3`.
    *   **Active State:** `bg-primary` + `text-white` + `shadow-glow`.
    *   **Inactive State:** `text-gray-400` + `hover:bg-white/5` + `hover:text-white`.
    *   **Icons:** Material Icons Round, `text-2xl`.

### 3.2 Search Bar
*   **Style:** Pill-shaped, floating.
*   **Input:** `rounded-3xl`, `bg-white` (or Dark Card), `shadow-soft`.
*   **Icon:** Absolute positioned inside.

### 3.3 Dashboard Cards (StatCards)
*   **Container:** `bg-white` (Dark: `bg-card-dark`), `rounded-3xl`, `shadow-soft`, `p-6`.
*   **Interaction:** `hover:translate-y-[-4px]` transition.
*   **Icon Wrapper:** `w-10 h-10 rounded-full` with pastel background (e.g., `bg-blue-50 text-blue-600`).
*   **Value:** `text-3xl font-bold`.
*   **Trend:** Small text with arrow icon, Green/Red based on value.

### 3.4 Data Table
*   **Container:** `bg-white`, `rounded-3xl`, `shadow-soft`, `p-8`.
*   **Header Row:**
    *   Border bottom.
    *   Text: `text-[10px] uppercase font-bold tracking-widest text-gray-400`.
*   **Data Rows:**
    *   `hover:bg-gray-50/50`.
    *   Images: `rounded-2xl`.
*   **Status Badges:**
    *   **Completed:** Solid Primary (`bg-sidebar-bg text-white` in light, `bg-primary` in dark).
    *   **Ongoing:** Outline (`border border-gray-200`).
    *   **Pending:** Pastel Warning (`bg-yellow-100`).

### 3.5 Chart Components
*   Use `recharts` (implied from imports).
*   Styled with rounded corners on bars/lines.
*   Tooltip: Custom styled to match standard card style.

## 4. Implementation Instructions

To apply this design to the existing system:

1.  **Install Dependencies:** Ensure `tailwindcss`, `recharts`, and Material Icons font (`https://fonts.googleapis.com/icon?family=Material+Icons+Round`) are available.
2.  **Configure Tailwind:** Update `tailwind.config.js` with the colors and extensions listed in Section 1.1.
3.  **Apply Layout:** Wrap the main authenticated application in the `flex h-screen overflow-hidden` container with `Sidebar` and `Main` areas.
4.  **Refactor Components:**
    *   Update all "Cards" to use `rounded-3xl shadow-soft`.
    *   Update Buttons to use `rounded-xl` or `rounded-full` (for icon buttons).
    *   Update Typography classes to match `Poppins` weights.
