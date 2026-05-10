# Frontend Guidelines — Autonomous BDR (Next.js + React)

**Version**: 1.0
**Date**: 2026-03-28
**Status**: Phase 1 Implementation Reference

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Pages & Routes](#3-pages--routes)
4. [State Management](#4-state-management)
5. [Forms & Validation](#5-forms--validation)
6. [Design System & Theme](#6-design-system--theme)
7. [Data Fetching & Caching](#7-data-fetching--caching)
8. [Error Handling & Loading States](#8-error-handling--loading-states)
9. [Accessibility (a11y)](#9-accessibility-a11y)
10. [Performance Optimization](#10-performance-optimization)
11. [Testing Strategy](#11-testing-strategy)
12. [Development Workflow](#12-development-workflow)
13. [Deployment](#13-deployment)

---

## 1. Architecture Overview

### Core Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | Next.js 14+ (App Router) | React Server Components, unified TypeScript, Vercel-optimized |
| **Runtime** | React 18+ | Industry standard, rich ecosystem, stable hooks API |
| **Language** | TypeScript (strict mode) | End-to-end type safety with backend tRPC |
| **Package Manager** | pnpm (monorepo) | Workspace support, faster installs, disk-efficient |
| **HTTP Client** | tRPC client | Auto-generated types from backend, zero schema duplication |
| **Server State** | TanStack Query v5 | Caching, deduplication, background sync, tRPC integration |
| **Client State** | Zustand or React Context | Lightweight, zero boilerplate, localStorage persistence |
| **Styling** | Tailwind CSS 3+ | Utility-first, dark mode (Material Design 3), minimal output |
| **Components** | shadcn/ui | Composable, accessible (Radix UI), Material Design 3 compatible |
| **Forms** | React Hook Form + Zod | Uncontrolled components, client/server validation |
| **Icons** | Lucide React | Lightweight, consistent, Material Design alignment |
| **Auth** | NextAuth.js v4+ | OAuth2 (Gmail/Outlook), session management, CSRF protection |
| **Deployment** | Vercel | Auto-scaling, edge functions, preview deployments |

### Key Principles

1. **Type Safety**: Leverage TypeScript `strict` mode throughout. tRPC ensures client-server type alignment.
2. **Transparency**: Every user action must show reasoning (see [Design System](#6-design-system--theme) for details).
3. **Minimal Approval Gates**: L2 autonomy (default) requires approval only for first touches; follow-ups auto-send.
4. **Server-First**: Use React Server Components where possible (data fetching, layout); reserve client components for interactivity.
5. **Accessibility**: WCAG AA standard on all components; semantic HTML, ARIA labels, keyboard navigation.

---

## 2. Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx              # Auth layout wrapper
│   │   │   ├── login/page.tsx          # Email + password + OAuth buttons
│   │   │   ├── signup/page.tsx         # Registration form
│   │   │   └── callback/[provider]/page.tsx # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + top nav + outlet
│   │   │   ├── dashboard/page.tsx      # Overview, KPI cards, campaign list
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx            # Campaign list with filters
│   │   │   │   ├── [campaignId]/page.tsx # Campaign detail + stats + outreach table
│   │   │   │   └── new/page.tsx        # Create campaign page (or modal)
│   │   │   ├── onboarding/
│   │   │   │   ├── page.tsx            # Wizard wrapper + step router
│   │   │   │   ├── step-1-icp/page.tsx
│   │   │   │   ├── step-2-value-prop/page.tsx
│   │   │   │   ├── step-3-voice-clone/page.tsx
│   │   │   │   ├── step-4-autonomy/page.tsx
│   │   │   │   ├── step-5-csv-upload/page.tsx
│   │   │   │   └── step-6-review/page.tsx
│   │   │   ├── replies/page.tsx        # Reply queue + classification
│   │   │   ├── settings/page.tsx       # User preferences + voice profiles
│   │   │   └── not-found.tsx
│   │   ├── layout.tsx                  # Root layout: fonts, providers, styles
│   │   ├── page.tsx                    # Landing/redirect to dashboard
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts # NextAuth.js handler
│   │   └── error.tsx                   # Error boundary wrapper
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   │   ├── TopNav.tsx              # Top bar + user menu
│   │   │   └── LayoutRoot.tsx          # Combines sidebar + topnav + outlet
│   │   ├── features/
│   │   │   ├── onboarding/
│   │   │   │   ├── OnboardingWizard.tsx      # Step state + navigation
│   │   │   │   ├── StepICP.tsx              # ICP form
│   │   │   │   ├── StepValueProp.tsx        # Value prop input
│   │   │   │   ├── StepVoiceClone.tsx       # Email upload, confidence
│   │   │   │   ├── StepAutonomy.tsx         # L1-L4 selector
│   │   │   │   ├── StepCSVUpload.tsx        # CSV drag-drop, preview
│   │   │   │   └── StepReview.tsx           # Summary, confirm
│   │   │   ├── campaigns/
│   │   │   │   ├── CampaignCard.tsx         # List item with KPI badges
│   │   │   │   ├── CampaignDetailHeader.tsx # Name, status, controls
│   │   │   │   ├── CampaignStats.tsx        # Reply rate chart
│   │   │   │   ├── OutreachList.tsx         # Paginated table
│   │   │   │   └── CreateCampaignModal.tsx  # New campaign flow
│   │   │   ├── outreach/
│   │   │   │   ├── EmailApprovalCard.tsx    # Research + email + approve/edit
│   │   │   │   ├── EmailPreview.tsx         # Final email with highlights
│   │   │   │   ├── ResearchBrief.tsx        # Org chart, news, signals
│   │   │   │   ├── VoiceConfidence.tsx      # Tone, structure badges
│   │   │   │   └── PersonalizationBadges.tsx # Which signals used
│   │   │   ├── replies/
│   │   │   │   ├── ReplyCard.tsx            # Classification, sentiment, actions
│   │   │   │   ├── ReplyClassificationBadge.tsx
│   │   │   │   ├── ObjectionDetails.tsx     # Objection type breakdown
│   │   │   │   ├── ReplyQueue.tsx           # List + filters
│   │   │   │   └── ReasoningDrawer.tsx      # Expandable reasoning panel
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICards.tsx             # Sent, replied, booked KPIs
│   │   │   │   ├── ReplyRateChart.tsx       # Time-series chart
│   │   │   │   ├── CampaignList.tsx         # Quick links
│   │   │   │   └── OnboardingProgress.tsx   # If incomplete, show progress
│   │   │   └── settings/
│   │   │       ├── AutonomyLevelSelector.tsx
│   │   │       ├── DailyCapSettings.tsx
│   │   │       ├── ICPFilterEditor.tsx
│   │   │       ├── VoiceProfileManager.tsx
│   │   │       ├── EmailConnectionStatus.tsx
│   │   │       └── DangerZone.tsx
│   │   ├── shared/
│   │   │   ├── Button.tsx               # shadcn/ui Button (Material Design 3)
│   │   │   ├── Input.tsx                # shadcn/ui Input
│   │   │   ├── Select.tsx               # shadcn/ui Select
│   │   │   ├── Dialog.tsx               # shadcn/ui Dialog
│   │   │   ├── Card.tsx                 # shadcn/ui Card
│   │   │   ├── Badge.tsx                # shadcn/ui Badge
│   │   │   ├── Skeleton.tsx             # Loading placeholder
│   │   │   ├── Alert.tsx                # shadcn/ui Alert
│   │   │   ├── Tabs.tsx                 # shadcn/ui Tabs
│   │   │   ├── Separator.tsx            # Visual divider
│   │   │   └── LoadingSpinner.tsx       # Centered spinner
│   │   └── ErrorBoundary.tsx            # Catch React errors
│   ├── hooks/
│   │   ├── useAuth.ts                   # useSession + custom hook
│   │   ├── useUser.ts                   # Fetch current user (TanStack Query)
│   │   ├── useCampaign.ts               # Fetch campaign by ID
│   │   ├── useOutreach.ts               # List, approve, reject outreach
│   │   ├── useReplies.ts                # List, escalate replies
│   │   ├── useMutateSettings.ts         # Update user settings
│   │   └── useLocalStorage.ts           # Persist UI state
│   ├── services/
│   │   ├── api.ts                       # tRPC client initialization
│   │   ├── trpc.ts                      # Auto-generated hooks from backend
│   │   └── sentry.ts                    # Sentry client init
│   ├── store/
│   │   ├── authStore.ts                 # Zustand: user, isAuthenticated, logout
│   │   ├── uiStore.ts                   # Zustand: sidebarOpen, theme, notifications
│   │   └── onboardingStore.ts           # Zustand: step, formData, progress
│   ├── lib/
│   │   ├── cn.ts                        # classname utility
│   │   ├── utils.ts                     # format helpers: date, currency, %
│   │   ├── validation.ts                # Zod schemas: campaign, ICP, etc.
│   │   └── constants.ts                 # enums, limits, defaults
│   ├── types/
│   │   ├── index.ts                     # Global types (from backend)
│   │   └── api.ts                       # Request/response types
│   ├── styles/
│   │   ├── globals.css                  # Tailwind imports, MD3 tokens
│   │   └── variables.css                # CSS custom properties
│   ├── middleware.ts                    # Auth redirect, logging
│   ├── env.ts                           # Zod-validated environment
│   ├── next.config.js                   # Image optimization, bundling
│   └── tsconfig.json                    # strict: true
├── public/
│   ├── logo.svg
│   └── og-image.png
├── .env.local.example                   # Example env vars
└── package.json

```

---

## 3. Pages & Routes

### Route Map

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|---------------|
| `/` | LandingPage | Redirect to /dashboard if authenticated; else show landing page | No |
| `/auth/login` | LoginPage | Email/password form + OAuth buttons (Gmail, Outlook) | No |
| `/auth/signup` | SignupPage | Email + password + terms agreement | No |
| `/auth/callback/[provider]` | OAuthCallback | Handle OAuth redirect, create session | No |
| `/dashboard` | DashboardPage | KPI cards, campaign list, reply queue summary, onboarding prompt | Yes |
| `/campaigns` | CampaignListPage | Table of all campaigns (status, KPI badges, filters) | Yes |
| `/campaigns/[campaignId]` | CampaignDetailPage | Campaign name, stats chart, outreach table, controls | Yes |
| `/campaigns/new` | CreateCampaignPage | Create new campaign (can be modal or dedicated page) | Yes |
| `/onboarding` | OnboardingWizardPage | Multi-step form wrapper; routes to step-N | Yes (redirect from `/dashboard` if incomplete) |
| `/onboarding/step-1-icp` | StepICPPage | Industry, company size, revenue, tech stack, pain points | Yes |
| `/onboarding/step-2-value-prop` | StepValuePropPage | 1–2 key differentiators | Yes |
| `/onboarding/step-3-voice-clone` | StepVoiceClonePage | Upload 30–50 rep emails, show confidence score | Yes |
| `/onboarding/step-4-autonomy` | StepAutonomyPage | Choose L1, L2, L3, or L4 (default L2) | Yes |
| `/onboarding/step-5-csv-upload` | StepCSVUploadPage | CSV with account list, validation + preview | Yes |
| `/onboarding/step-6-review` | StepReviewPage | Summary of all choices; confirm to finish | Yes |
| `/replies` | ReplyQueuePage | Pending replies with classification, action buttons | Yes |
| `/settings` | SettingsPage | Autonomy, daily cap, ICP, voice profile, email connection | Yes |
| `/404` | NotFoundPage | 404 error | — |

### Onboarding Flow

Users land on `/onboarding` after sign-up. The `OnboardingWizard` component manages step state and routing:

- Step 1-5: Sequential form steps
- Step 6: Review and confirm
- On success: Update user settings, redirect to `/dashboard`
- User can navigate back within onboarding (no progress loss)

### Email Approval Queue

When user has **L1 or L2** autonomy and outreach is pending approval, the dashboard shows a prominent "Pending Approvals" card. Clicking enters `/campaigns/[campaignId]` with an approval panel showing:
- Research brief (org chart, news, pain signals)
- Generated email (subject + body)
- Voice profile confidence score
- Personalization techniques used
- Approve, Edit, or Reject buttons

---

## 4. State Management

### Server State (TanStack Query v5)

Use TanStack Query for all remote data (campaigns, outreach, replies, user profile).

**Key Points**:
- **Query Keys**: Hierarchical (e.g., `['campaigns', campaignId, 'outreach']`)
- **Stale Time**: 30 seconds (short for active dashboard; data changes frequently)
- **Cache Time**: 5 minutes
- **Background Refetch**: Enabled (keep data fresh while user is idle)
- **Integration with tRPC**: tRPC mutations auto-invalidate related queries

**Example: Fetch Campaign**

```typescript
// src/hooks/useCampaign.ts
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/services/api'

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId],
    queryFn: () => trpc.campaigns.getById.query({ campaignId }),
    staleTime: 30000,        // 30 seconds
    gcTime: 1000 * 60 * 5,   // 5 minutes (renamed from cacheTime)
  })
}
```

**Example: Mutation with Invalidation**

```typescript
// Approve outreach
const { mutate: approveOutreach } = trpc.outreach.approve.useMutation({
  onSuccess: (data) => {
    // Invalidate related queries
    queryClient.invalidateQueries({
      queryKey: ['outreach', data.id],
    })
    queryClient.invalidateQueries({
      queryKey: ['campaigns', data.campaignId, 'outreach'],
    })
    toast.success('Email approved and scheduled')
  },
  onError: (error) => {
    toast.error(`Failed to approve: ${error.message}`)
  },
})
```

### Client State (Zustand)

Use Zustand for UI-only state (sidebar collapsed, theme, modals, notifications).

**Store Definitions**:

```typescript
// src/store/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]

  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      notifications: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTheme: (theme) => set({ theme }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
)
```

```typescript
// src/store/onboardingStore.ts
import { create } from 'zustand'

interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  formData: {
    icp?: ICP
    valueProp?: string
    voiceProfileId?: string
    autonomyLevel?: AutonomyLevel
    csvData?: Account[]
  }
  isSubmitting: boolean

  setStep: (step: number) => void
  setFormData: (data: Partial<OnboardingState['formData']>) => void
  setSubmitting: (submitting: boolean) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  formData: {},
  isSubmitting: false,

  setStep: (step) => set({ currentStep: step as any }),
  setFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  reset: () => set({ currentStep: 1, formData: {}, isSubmitting: false }),
}))
```

### Auth State (NextAuth.js + React Context)

```typescript
// src/hooks/useAuth.ts
import { useSession, signIn, signOut } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    signIn,
    signOut,
  }
}
```

---

## 5. Forms & Validation

### Form Framework: React Hook Form + Zod

Use uncontrolled components (React Hook Form) for minimal re-renders. Validate client-side with Zod; server validates again via tRPC input.

**Example: Campaign Creation Form**

```typescript
// src/lib/validation.ts
import { z } from 'zod'

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name required')
    .max(100, 'Name too long'),

  icp: z.object({
    industries: z.array(z.string()).min(1, 'Select at least one industry'),
    companySize: z.tuple([z.number(), z.number()]),
    revenueStagee: z.string().optional(),
    excludeList: z.array(z.string()).optional(),
  }),

  voiceProfileId: z
    .string()
    .uuid('Invalid voice profile ID'),

  autonomyLevel: z.enum(['L1', 'L2', 'L3', 'L4']),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
```

```typescript
// src/components/features/campaigns/CreateCampaignModal.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCampaignSchema, type CreateCampaignInput } from '@/lib/validation'
import { trpc } from '@/services/api'
import { toast } from 'sonner'

export function CreateCampaignModal() {
  const { mutate, isPending } = trpc.campaigns.create.useMutation({
    onSuccess: (campaign) => {
      toast.success(`Campaign "${campaign.name}" created`)
      form.reset()
      // Invalidate campaigns list
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      autonomyLevel: 'L2',
    },
  })

  function onSubmit(data: CreateCampaignInput) {
    mutate(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register('name')}
        placeholder="Campaign name"
        type="text"
      />
      {form.formState.errors.name && (
        <span className="text-red-500">{form.formState.errors.name.message}</span>
      )}
      {/* More fields... */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
```

**Key Principles**:
- **Register inputs** with `register()` (uncontrolled)
- **Watch state** sparingly (only when value affects other fields)
- **Validation** happens on blur by default; can change to onChange
- **Server validation** re-runs via tRPC; frontend validation is UX only

---

## 6. Design System & Theme

### Material Design 3 Dark Theme

The app uses **Material Design 3 colors** in dark mode by default. All shadcn/ui components are configured with MD3 tokens.

**Theme Variables** (CSS Custom Properties):

```css
/* src/styles/variables.css */

/* Primary */
--color-primary: #d0bcff;           /* Light: #6750a4 */
--color-on-primary: #381e72;
--color-primary-container: #eaddff;
--color-on-primary-container: #21005e;

/* Secondary */
--color-secondary: #ccc2dc;         /* Light: #625b71 */
--color-on-secondary: #332d41;
--color-secondary-container: #e8def8;
--color-on-secondary-container: #1d192b;

/* Tertiary */
--color-tertiary: #efb8c8;          /* Light: #7d5260 */

/* Success (for positive replies, bookings) */
--color-success: #81c784;           /* Light: #2e7d32 */
--color-on-success: #1b5e20;

/* Warning (pending actions) */
--color-warning: #ffb74d;           /* Light: #f57f17 */
--color-on-warning: #ff6f00;

/* Error (unsubscribes, failures) */
--color-error: #f44336;             /* Light: #d32f2f */
--color-on-error: #ffebee;

/* Surface (backgrounds) */
--color-surface: #1c1b1f;           /* Dark mode */
--color-on-surface: #fffbfe;
--color-surface-variant: #49454e;
--color-on-surface-variant: #cac7d0;

/* Outline (borders, dividers) */
--color-outline: #79747e;
--color-outline-variant: #49454e;
```

**Tailwind Configuration**:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary))',
        'on-primary': 'hsl(var(--color-on-primary))',
        secondary: 'hsl(var(--color-secondary))',
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        error: 'hsl(var(--color-error))',
        surface: 'hsl(var(--color-surface))',
        'on-surface': 'hsl(var(--color-on-surface))',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--color-on-surface)',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
```

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: 32px (H1), 28px (H2), 24px (H3), 20px (H4)
- **Body**: 16px (default)
- **Caption**: 12px (small text)

### Component Examples

**Button** (Material Design 3 variant):

```tsx
import { Button } from '@/components/shared/Button'

// Filled button (primary)
<Button>Send Email</Button>

// Outlined button (secondary)
<Button variant="outline">Cancel</Button>

// Ghost button (text-only)
<Button variant="ghost">Learn more</Button>

// Disabled state
<Button disabled>Processing...</Button>
```

**Badge** (for reply classification):

```tsx
<Badge variant="success">Positive</Badge>
<Badge variant="warning">Objection</Badge>
<Badge variant="destructive">Unsubscribe</Badge>
<Badge variant="secondary">Noise</Badge>
```

---

## 7. Data Fetching & Caching

### tRPC Client Setup

```typescript
// src/services/api.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers' // Import from backend

export const trpc = createTRPCReact<AppRouter>()
```

### Usage in Components

**Query (fetch data)**:

```typescript
function CampaignList() {
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery()

  if (isLoading) return <CampaignSkeleton />
  if (!campaigns) return <Alert>No campaigns found</Alert>

  return (
    <div>
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}
```

**Mutation (modify data)**:

```typescript
function ApproveOutreach({ outreachId }: { outreachId: string }) {
  const { mutate, isPending } = trpc.outreach.approve.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['outreach', outreachId],
      })
      toast.success('Email approved')
    },
  })

  return (
    <button
      onClick={() => mutate({ outreachId })}
      disabled={isPending}
    >
      {isPending ? 'Approving...' : 'Approve'}
    </button>
  )
}
```

### Pagination (Cursor-based)

```typescript
function OutreachList({ campaignId }: { campaignId: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const { data, hasMore, fetchMore } = trpc.outreach.list.useInfiniteQuery(
    { campaignId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const items = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <>
      {items.map((item) => (
        <OutreachRow key={item.id} outreach={item} />
      ))}
      {hasMore && (
        <button onClick={() => fetchMore()}>Load more</button>
      )}
    </>
  )
}
```

### Optimistic Updates

```typescript
const queryClient = useQueryClient()

const { mutate } = trpc.replies.escalate.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: ['replies', variables.replyId],
    })

    // Snapshot previous data
    const previousReply = queryClient.getQueryData(['replies', variables.replyId])

    // Optimistically update
    queryClient.setQueryData(['replies', variables.replyId], (old: any) => ({
      ...old,
      status: 'escalated',
    }))

    return { previousReply }
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ['replies', variables.replyId],
      context?.previousReply
    )
  },
  onSuccess: () => {
    // Refetch to ensure sync
    queryClient.invalidateQueries({
      queryKey: ['replies'],
    })
  },
})
```

---

## 8. Error Handling & Loading States

### Loading States

Use Skeleton components for initial load; Spinner for mutations:

```typescript
function CampaignDetail({ campaignId }: { campaignId: string }) {
  const { data: campaign, isLoading, error } = useCampaign(campaignId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading campaign</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Alert>
    )
  }

  return <CampaignView campaign={campaign} />
}
```

### Error Boundary

Wrap entire dashboard in an Error Boundary to catch React errors:

```typescript
// src/components/ErrorBoundary.tsx
'use client'

import React, { Component } from 'react'
import { Button } from '@/components/shared/Button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
    // Send to Sentry
    if (typeof window !== 'undefined') {
      import('sentry').then(({ captureException }) => {
        captureException(error, { contexts: { react: errorInfo } })
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-on-surface-variant mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Toast Notifications

Use `sonner` for toast notifications:

```typescript
import { toast } from 'sonner'

// Success
toast.success('Email sent!')

// Error
toast.error('Failed to send email', {
  description: 'Network error. Please retry.',
})

// Loading
const promise = trpc.outreach.send.mutate(...)
toast.promise(promise, {
  loading: 'Sending email...',
  success: 'Email sent!',
  error: 'Failed to send',
})
```

---

## 9. Accessibility (a11y)

### Semantic HTML

```typescript
// Good: semantic structure
<main className="dashboard">
  <section>
    <h1>Dashboard</h1>
    <article>
      <h2>Recent Campaigns</h2>
      {/* content */}
    </article>
  </section>
</main>

// Bad: div soup
<div className="dashboard">
  <div>
    <div>Dashboard</div>
    <div>
      <div>Recent Campaigns</div>
    </div>
  </div>
</div>
```

### ARIA Labels

```typescript
// Button with icon: provide aria-label
<button
  onClick={toggleSidebar}
  aria-label="Toggle sidebar"
  aria-expanded={sidebarOpen}
>
  <MenuIcon size={24} />
</button>

// Form: associate label with input
<label htmlFor="campaign-name">Campaign Name</label>
<Input id="campaign-name" {...register('name')} />

// Live region: announce updates
<div aria-live="polite" aria-atomic="true">
  {replyCount} new replies
</div>

// Dialog: set aria-labelledby
<Dialog open={isOpen}>
  <DialogTitle id="dialog-title">Approve Email</DialogTitle>
  <DialogContent aria-labelledby="dialog-title">
    {/* content */}
  </DialogContent>
</Dialog>
```

### Keyboard Navigation

- **Tab**: Navigate to next focusable element
- **Shift+Tab**: Navigate to previous element
- **Enter/Space**: Activate button
- **Escape**: Close modal/dropdown
- **Arrow keys**: Navigate menu items, date picker

```typescript
// Example: Custom menu component
function Menu() {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      setSelectedIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      selectItem(items[selectedIndex])
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {/* menu items */}
    </div>
  )
}
```

### Color Contrast

- **Text on background**: Minimum 4.5:1 (AA standard)
- **Focus indicators**: Visible outline or border
- **Icons + text**: Don't rely on color alone (e.g., "Red = error" → add icon)

---

## 10. Performance Optimization

### Code Splitting

Next.js App Router automatically splits code per-route. For large components, use dynamic imports:

```typescript
import dynamic from 'next/dynamic'

const OnboardingWizard = dynamic(
  () => import('@/components/features/onboarding/OnboardingWizard'),
  { loading: () => <LoadingSpinner /> }
)

export default function OnboardingPage() {
  return <OnboardingWizard />
}
```

### Image Optimization

Use Next.js `Image` component (lazy loading, srcset):

```typescript
import Image from 'next/image'

export function CampaignHeader({ campaign }: { campaign: Campaign }) {
  return (
    <div className="flex items-center gap-4">
      <Image
        src={campaign.logo}
        alt={campaign.name}
        width={64}
        height={64}
        className="rounded-full"
      />
      <h1>{campaign.name}</h1>
    </div>
  )
}
```

### Bundle Analysis

```bash
pnpm run bundle-analyze  # Visualize bundle size
```

### Lighthouse Targets (Phase 1+)

- **Performance**: >85
- **Accessibility**: >95
- **Best Practices**: >90
- **SEO**: >90

### Web Vitals

Monitor Core Web Vitals (CLS, FID, LCP):

```typescript
// src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

if (typeof window !== 'undefined') {
  getCLS(console.log)
  getFID(console.log)
  getFCP(console.log)
  getLCP(console.log)
  getTTFB(console.log)
}
```

---

## 11. Testing Strategy

### Unit Testing (Vitest + React Testing Library)

Test component logic, hooks, utils in isolation.

```typescript
// src/components/features/outreach/__tests__/EmailApprovalCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmailApprovalCard } from '../EmailApprovalCard'

describe('EmailApprovalCard', () => {
  it('renders email preview and research brief', () => {
    const outreach = {
      id: '123',
      subject: 'Test',
      body: 'Test body',
      researchBrief: {
        orgChart: [{ name: 'John', title: 'CEO' }],
      },
    }

    render(<EmailApprovalCard outreach={outreach} />)

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('calls onApprove when approve button clicked', async () => {
    const onApprove = vi.fn()
    render(<EmailApprovalCard outreach={outreach} onApprove={onApprove} />)

    const approveButton = screen.getByRole('button', { name: /approve/i })
    await userEvent.click(approveButton)

    expect(onApprove).toHaveBeenCalled()
  })
})
```

### E2E Testing (Playwright)

Test critical user flows end-to-end.

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign up and create campaign', async ({ page }) => {
  // Sign up
  await page.goto('/auth/signup')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'SecurePassword123!')
  await page.click('button[type="submit"]')

  // Onboarding: Step 1 (ICP)
  await page.waitForURL('/onboarding/step-1-icp')
  await page.selectOption('select[name="industry"]', 'SaaS')
  await page.fill('input[name="companySize"]', '50-200')
  await page.click('button:has-text("Next")')

  // ... more steps ...

  // Dashboard
  await page.waitForURL('/dashboard')
  expect(await page.locator('text=Welcome')).toBeVisible()
})
```

### Testing Coverage Targets

| Category | Target |
|----------|--------|
| Critical paths (auth, onboarding, approval) | 80%+ |
| Components | 60%+ |
| Utils | 90%+ |
| Overall | 70%+ |

---

## 12. Development Workflow

### Local Setup

```bash
# Install dependencies
pnpm install

# Start frontend + backend
pnpm dev

# Frontend runs on http://localhost:3000
# Backend on http://localhost:3001
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_GOOGLE_ID=<from-console>
NEXTAUTH_GOOGLE_SECRET=<from-console>
NEXTAUTH_MICROSOFT_ID=<from-console>
NEXTAUTH_MICROSOFT_SECRET=<from-console>
NEXT_PUBLIC_SENTRY_DSN=<if-using-sentry>
```

### Pre-commit Hooks

```bash
# Git hooks via husky + lint-staged
pnpm install husky --save-dev
npx husky install

# Runs: prettier, eslint, type-check before commit
```

### VS Code Setup

**Extensions**:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Thunder Client (REST tester)

**settings.json**:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.enablePromptUseWorkspaceTypeScriptSdk": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 13. Deployment

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Auto-deploys on push to `main`
4. Preview deployments on every PR

```bash
# Manual deployment
vercel deploy --prod
```

### Backend (AWS / GCP / Azure)

Backend runs separately (see tech-stack.md for details). Frontend calls backend via `NEXT_PUBLIC_API_URL`.

### Production Checklist

- [ ] Environment variables set in Vercel + backend
- [ ] NextAuth secrets configured
- [ ] OAuth credentials for production Google/Microsoft
- [ ] Sentry DSN configured
- [ ] Database migrations applied
- [ ] Email service (SES/Mailgun) configured
- [ ] Lighthouse scores >85
- [ ] 404 page tested
- [ ] Error boundary tested (simulate error in dev)
- [ ] Scroll position restored on navigation
- [ ] Images optimized and cached

---

## Appendix: Quick Reference

### Component Import Pattern

```typescript
// Always import from relative paths or aliases
import { Button } from '@/components/shared/Button'
import { useCampaign } from '@/hooks/useCampaign'
import { cn } from '@/lib/cn'
```

### Type Safety Checklist

- [ ] Inputs: Use Zod schema
- [ ] API calls: Use tRPC (auto-types)
- [ ] Props: Define `interface` or type
- [ ] Env vars: Use `env.ts` with Zod
- [ ] No `any` types (use `unknown` if needed, then narrow)

### Common Patterns

**Fetch + Display**:
```typescript
const { data, isLoading } = trpc.resource.list.useQuery()
if (isLoading) return <Skeleton />
return <List items={data} />
```

**Mutation with Toast**:
```typescript
const { mutate, isPending } = trpc.action.useMutation({
  onSuccess: () => toast.success('Done'),
  onError: (e) => toast.error(e.message),
})
return <button onClick={() => mutate()} disabled={isPending}>Send</button>
```

**URL Query Params**:
```typescript
import { useSearchParams } from 'next/navigation'
const searchParams = useSearchParams()
const campaignId = searchParams.get('campaignId')
```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Phase 1 Implementation
