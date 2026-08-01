# MeterMint Agent Rules & Guidelines

## 1. Technical Stack & Standards
- Backend: NestJS / Express with TypeScript (Strict mode enabled, no `any` types).
- Frontend: Next.js (App Router), Tailwind CSS, Framer Motion.
- Database & ORM: PostgreSQL with Prisma ORM.
- Async Queue: BullMQ with Redis.
- Testing: Jest & Supertest for backend integration tests.

## 2. Directory Structure & Monorepo Boundaries
- Keep all backend logic inside `/backend`.
- Keep all dashboard UI logic inside `/frontend`.
- Keep common configurations at the root level.
- Do not import code across frontend and backend directly.

## 3. Core Architectural & Security Rules
- Multi-Tenant Security: NEVER accept `organizationId` or `tenantId` from an API request body or URL path parameter. Always derive tenant context from the validated `x-api-key` header attached to `req.tenant`.
- Idempotency: All incoming usage events carry a client-supplied `eventId`. Operations on events must enforce uniqueness using `(organizationId, eventId)`.
- Fast Ingestion: The usage ingestion API must validate the payload, drop it into the BullMQ queue, and immediately return HTTP `202 Accepted`. Heavy aggregation logic must stay inside background workers.
- Deterministic Math: Invoicing math must be exact and reproducible for any closed billing period.

## 4. Execution Workflow
- Implement features incrementally—one module at a time.
- Update `backend/prisma/schema.prisma` first whenever a database model change is required.
- Include a specific verification step (`curl` command or test command) after completing every backend endpoint or worker feature.

# Frontend Architecture & Engineering Guidelines (`/frontend`)

This document defines the architectural standards, performance constraints, design patterns, and coding conventions for the Next.js application located within the `/frontend` directory of this monorepo. All code written, refactored, or reviewed within `/frontend` must strictly adhere to these rules.

---

## 1. Reusable Component First Policy

* **Mandatory Component Reuse:** Never instantiate raw, unstyled HTML elements (e.g., `<button>`, `<a>`, `<input>`, `<select>`) directly within page views or feature modules if a standardized UI primitive exists. Always import and use components from `@/components/ui/`.
* **Primitive Component Architecture:** All foundational UI elements (`Button`, `Link`, `Accordion`, `Card`, `Modal`, `Input`, `Dropdown`, `Badge`, `Skeleton`) must reside in `frontend/components/ui/` and be styled using Tailwind CSS and `class-variance-authority` (CVA).
* **Standardized Component Props Interface:**
  * Primitives must extend standard React HTML attributes (`React.ButtonHTMLAttributes`, `React.HTMLAttributes`).
  * Prop APIs must remain consistent across primitives (e.g., standardizing `variant`, `size`, `isLoading`, `leftIcon`, and `rightIcon`).

```tsx
// Example Standard: @/components/ui/button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="mr-2 inline-flex items-center">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? (
          <span className="ml-2 inline-flex items-center">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);
Button.displayName = "Button";
```

---

## 2. Strict TypeScript & Type Safety Rules

* **Zero `any` Policy:** The `any` keyword is strictly prohibited. Use explicit interfaces, generics, or `unknown` with narrowing type guards.
* **No Unsafe Type Casting:** Avoid `as unknown as Type` or forced type assertions (`!`). Utilize type predicate functions or schema validation for unknown inputs.
* **Shared Centralized Types:**
  * Define global domain models, entity schemas, and API contracts inside `frontend/types/`.
  * Share monorepo-wide data models via internal packages (`@monorepo/types`).
* **Strict Component Typing:** All React components must explicitly type their props using explicit `interface` declarations.
* **Validated Server Boundaries:** All external data fetched via APIs, URL search params, or Server Actions must be validated at runtime using `zod` schemas to infer compile-time types automatically.

---

## 3. Custom Hooks & Feature Business Logic

* **Decouple UI from Logic:** Components must focus strictly on layout and UI rendering. Any component with complex state management, side effects, or async workflows must encapsulate that logic into a custom hook in `frontend/hooks/`.
* **Multi-Use Feature Extraction:** Features used across multiple views or requiring shared reactive state (e.g., `useAuth`, `useUser`, `useCart`, `useNotification`, `useDebounce`) must be structured as reusable custom hooks.
* **Separation of State Layer:**
  * **Server State:** Handle with TanStack Query (React Query) or SWR for caching, background revalidation, and optimistic updates.
  * **Global UI State:** Handle via React Context or Zustand for application-wide ephemeral state.
  * **Local UI State:** Handle via `useState`/`useReducer` strictly limited to individual isolated components.

```tsx
// Example Standard: @/hooks/use-auth.ts
import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { User } from "@/types/user";

export function useAuth() {
  const { data: user, error, mutate, isLoading } = useSWR<User>("/api/v1/auth/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const isAuthenticated = useMemo(() => Boolean(user && !error), [user, error]);

  const logout = useCallback(async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    await mutate(null, false);
  }, [mutate]);

  return {
    user: user ?? null,
    isLoading,
    isError: Boolean(error),
    isAuthenticated,
    logout,
  };
}
```

---

## 4. Visual Elements & Iconography Rules

* **Lucide React Standard:** `lucide-react` is the single source of truth for UI iconography across the application. Importing external SVG packages or unverified icon libraries is forbidden.
* **Pervasive Visual Cues:** Incorporate contextually relevant Lucide icons wherever visual visual reinforcement aids usability:
  * Buttons and actionable CTA links (`leftIcon`, `rightIcon`).
  * Card header titles and metadata badges.
  * Navigation links, tab headers, sidebar items, and breadcrumbs.
  * Form field adornments and validation state indicators.
* **Icon Sizing & Accessibility Standards:**
  * Icons must dynamically scale relative to standard text sizes (e.g., `h-4 w-4` for default buttons, `h-5 w-5` for cards/headings).
  * Decorative icons must include `aria-hidden="true"`.
  * Standalone icon buttons must include an explicit `aria-label` attribute on the container button.

---

## 5. Performance Optimization & Memoization Rules

### Memoization Guidance
* **`useMemo`:** Wrap computationally expensive calculations, array filtering/sorting, or complex data transformations.
* **`useCallback`:** Wrap event handler callbacks passed down to memoized child components to prevent unnecessary re-render cascades.
* **`React.memo`:** Wrap pure, high-frequency UI components or large lists where props rarely change.

### Dynamic Imports & Code Splitting
* **Lazy Load Below-The-Fold Components:** Dynamically load non-critical heavy modules (modals, visualizers, rich text editors, charts) using Next.js `dynamic()` with a loading skeleton fallback.

```tsx
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AnalyticsChart = dynamic(
  () => import("@/components/features/analytics/analytics-chart").then((mod) => mod.AnalyticsChart),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-xl" />,
    ssr: false,
  }
);
```

### Next.js Native Optimizations
* **Images:** Standardize on `next/image` with explicit `width`, `height`, `alt`, and `sizes` attributes. Use the `priority` prop strictly for above-the-fold hero imagery.
* **Typography:** Load all fonts via `next/font` to ensure automatic web font optimization and prevent layout shifts (CLS).
* **Scripts:** Load third-party scripts through `next/script` using optimal execution strategies (`afterInteractive`, `lazyOnload`).

---

## 6. Mobile-First & Fully Responsive Layout Rules

* **Mobile-First CSS Strategy:** Write Tailwind utility classes mobile-first. Default classes represent mobile devices, followed progressively by breakpoint overrides (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).
* **Supported Viewport Range:** Every page, component, modal, and grid layout must render flawlessly across all device classes:
  * **Mobile:** 320px – 640px
  * **Tablet:** 641px – 1024px
  * **Laptop/Desktop:** 1025px+
* **Fluid Layout Containers:**
  * Hardcoded pixel widths (`width: 500px`) are strictly banned on structural elements. Use percentage, flex, or CSS Grid units (`w-full`, `max-w-7xl`, `mx-auto`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
* **Touch Target Compliance:** All interactive elements (buttons, inputs, links, toggles) on mobile viewports must meet the minimum accessibility touch target size of **44x44px** or explicit padding padding equivalents (`py-2.5 px-4`).

---

## 7. Next.js Directory Architecture (`/frontend`)

Code must strictly adhere to the following file layout:

```text
/frontend
├── app/                  # App Router: Pages, Layouts, API Routes, Route Groups
│   ├── (auth)/           # Authenticated route group
│   ├── (dashboard)/      # Main dashboard route group
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # React Components
│   ├── ui/               # Reusable primitive design system components (Button, Input, Card)
│   └── features/         # Domain-specific UI features (AuthForm, UserSettings, BillingTable)
├── hooks/                # Custom hooks containing isolated business logic (useAuth, useUser)
├── lib/                  # Framework-agnostic utility functions, clients, and setup
│   ├── api-client.ts     # Configured fetcher/axios instance
│   └── utils.ts          # Classnames merge utility (cn)
├── services/             # API network calls and Next.js Server Actions
├── types/                # Global TypeScript definitions and domain contracts
├── constants/            # Application static constants, navigation links, config
└── styles/               # Global CSS files, Tailwind configuration
```

---

## 8. Additional Production Guidelines

### Error Boundaries & Resilience
* Every route segment should implement native Next.js `error.tsx` and `loading.tsx` handlers.
* Wrap third-party widgets or complex widgets with isolated React Error Boundaries to prevent full-page crashes.

### Form Architecture
* All form state management must use **React Hook Form**.
* All form validation must use **Zod** schemas.
* Derive form field types directly from Zod schemas:
  ```ts
  import { z } from "zod";

  export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

  export type LoginInput = z.infer<typeof loginSchema>;
  ```

### Accessibility Standards (a11y)
* Maintain WCAG 2.1 Level AA compliance.
* All interactive non-button elements must support keyboard navigation (`tabIndex={0}`, `onKeyDown`).
* Color choices must meet contrast standards (4.5:1 ratio for normal body text).