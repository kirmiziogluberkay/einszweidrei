# GitHub Copilot Chat Workspace Instructions

## About this workspace

This is a Next.js 14 application using the App Router and React 18. It is a marketplace-style project built with Tailwind CSS and Supabase for authentication, storage, and data access.

Key characteristics:
- `app/` contains the App Router pages and nested layouts.
- `components/` holds reusable UI components and grouped subfolders like `layout/`, `ads/`, `messages/`, and `polls/`.
- `hooks/` contains custom React hooks such as authentication and data fetching helpers.
- `lib/` contains shared helpers and Supabase client logic.
- `providers/` contains global providers like `AuthProvider`.
- `middleware.js` handles session refresh and route protection for authenticated and admin areas.

## How to run

Use standard npm commands at the workspace root.

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

There are no test scripts in this repo at the moment.

## Environment

The app depends on `.env.local` environment variables.

Important values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use `.env.local.example` as the example file.

## Architecture and conventions

- The project uses Next.js App Router with server components by default.
- Client components must use `use client` and are typically found in interactive UI elements, forms, and components that use browser APIs.
- `lib/supabase/client.js` provides the browser Supabase client via `createBrowserClient()`.
- `middleware.js` protects routes such as `/myprofile`, `/inbox`, `/post-ad`, and `/admin`.
- `app/layout.js` wraps all pages with `AuthProvider` and `QueryProvider`.
- Images are allowed from Supabase storage URLs via `next.config.js` remote patterns.

## Coding expectations

- Preserve the App Router patterns: `page.js`, `layout.js`, and nested folders.
- Keep component responsibilities small and reusable.
- Prefer using existing hooks and helper modules rather than duplicating logic.
- Maintain consistent naming in the existing folder structure.
- Do not modify generated folders like `.next/`, `node_modules/`, or `.vercel/`.

## What to avoid

- Do not add new dependencies without explicit user approval.
- Do not change environment variable names unless fixing a bug.
- Do not assume type checking is enforced beyond the existing JavaScript conventions.
- Do not refactor large portions of the app without a clear user request.
