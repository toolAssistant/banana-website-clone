# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application that clones the "Nano Banana" AI image editor website. It allows users to upload images and edit them using text prompts via AI (OpenRouter API with Google's Gemini 2.5 Flash Image model).

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom banana-themed color palette
- **UI Components**: shadcn/ui (New York style variant)
- **AI Integration**: OpenRouter API (Google Gemini 2.5 Flash Image)
- **Analytics**: Vercel Analytics
- **Package Manager**: pnpm

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Architecture

### Directory Structure

- **`app/`**: Next.js App Router pages and API routes
  - `layout.tsx`: Root layout with metadata and Inter font
  - `page.tsx`: Home page composing all landing page sections
  - `globals.css`: Global styles with Tailwind v4 and custom CSS variables
  - `api/generate/route.ts`: Server-side API endpoint for AI image generation

- **`components/`**: React components
  - Landing page sections: `hero.tsx`, `features.tsx`, `showcase.tsx`, `testimonials.tsx`, `faq.tsx`, `footer.tsx`, `header.tsx`
  - Core feature: `image-editor.tsx` - the main AI image editing interface
  - `theme-provider.tsx`: Theme management (if used)
  - `ui/`: shadcn/ui components library

- **`lib/`**: Utility functions
  - `utils.ts`: Contains `cn()` helper for merging Tailwind classes

- **`hooks/`**: Custom React hooks
  - `use-mobile.ts`: Mobile detection hook
  - `use-toast.ts`: Toast notification hook

- **`public/`**: Static assets (images, icons)

- **`styles/`**: Global CSS (deprecated, now using `app/globals.css`)

### Key Architectural Patterns

**1. App Router Structure**
- Uses Next.js 16 App Router (not Pages Router)
- Server Components by default; Client Components marked with `"use client"`
- `image-editor.tsx` is a Client Component (handles user interaction)
- API routes in `app/api/` using Route Handlers

**2. AI Image Generation Flow**
```
User uploads image + enters prompt
  ↓
ImageEditor component sends POST to /api/generate
  ↓
Route handler calls OpenRouter API (Gemini 2.5 Flash Image)
  ↓
Response parsing extracts images from various formats
  ↓
Images returned as URLs/base64 to client
  ↓
Displayed in ImageEditor component
```

**3. Image Extraction Logic**
The API route (`app/api/generate/route.ts`) includes sophisticated image extraction:
- Handles multiple response formats from OpenRouter
- Extracts images from message content (arrays or strings)
- Parses data URLs, markdown image syntax, and direct URLs
- Normalizes different image URL formats

**4. Styling System**
- Tailwind CSS v4 with `@import "tailwindcss"` (not require/plugin pattern)
- Custom CSS variables for theming (banana-themed yellow/orange palette)
- OKLCH color space for better color interpolation
- Dark mode support via CSS variables
- shadcn/ui components use CSS variables for theming

**5. Path Aliases**
```typescript
@/* → ./*
@/components → ./components
@/lib → ./lib
@/hooks → ./hooks
```

## Environment Variables

Required environment variables (add to `.env.local`):

```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_DEBUG=false  # Set to "true" for debug logging
```

## Configuration Files

- **`next.config.mjs`**: TypeScript build errors ignored, images unoptimized
- **`tsconfig.json`**: Path aliases configured, strict mode enabled
- **`components.json`**: shadcn/ui configuration (New York style, CSS variables)
- **`postcss.config.mjs`**: PostCSS with Tailwind v4 plugin
- **`package.json`**: Standard Next.js scripts

## API Routes

### POST `/api/generate`

Generates AI-edited images based on prompt and uploaded image.

**Request Body:**
```typescript
{
  prompt: string,      // Text description of desired edit
  imageData: string    // Base64 encoded image data
}
```

**Response:**
```typescript
{
  images: string[]     // Array of image URLs (data URLs or HTTP URLs)
}
```

**Error Response:**
```typescript
{
  error: string
}
```

## Component Patterns

**shadcn/ui Components**
- Located in `components/ui/`
- Use the `cn()` utility from `lib/utils.ts` for class merging
- Follow New York style variant conventions
- Rely on CSS variables for theming

**Client vs Server Components**
- Interactive components (forms, image upload) are Client Components
- Static sections (Hero, Features, etc.) can be Server Components
- Use `"use client"` directive at top of file for Client Components

## Debugging

Enable OpenRouter API debugging:
```bash
OPENROUTER_DEBUG=true pnpm dev
```

This logs completion responses to console including:
- Completion ID and model used
- Finish reason
- Message content and images

## Common Gotchas

1. **TypeScript errors ignored in build**: `next.config.mjs` has `ignoreBuildErrors: true` - fix errors before production
2. **Image optimization disabled**: Images are unoptimized for simpler deployment
3. **Tailwind v4 syntax**: Uses `@import "tailwindcss"` instead of older plugin pattern
4. **OKLCH colors**: Custom color palette uses OKLCH color space (modern CSS)
5. **OpenRouter response formats**: Image extraction handles multiple response formats - modify `extractImages()` if format changes
