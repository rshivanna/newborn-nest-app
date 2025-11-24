# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Newborn Gestation Age Estimation Data Collection Tool - a React-based patient management system for collecting medical photos of newborns. The application allows healthcare workers to manage patient records and capture/upload medical images (face, ear, foot, palm) for gestation age estimation purposes.

Built with Vite + React + TypeScript + shadcn/ui + Tailwind CSS.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm preview
```

## Architecture

### State Management

- **Global State**: Patient data is managed at the App level (App.tsx) using React useState
- **State Flow**: Patient data flows down through props to Index (list view) and PatientDetail (detail view)
- **Updates**: Both views can update patient data through callback props (onUpdatePatients, onUpdatePatient)
- **No Backend**: Currently stores all data in-memory; patient data is lost on refresh

### Routing Structure

- `/` - Patient list/dashboard (Index.tsx)
- `/patient/:id` - Patient detail view with image upload (PatientDetail.tsx)
- `*` - 404 Not Found page (NotFound.tsx)

Note: All custom routes must be added ABOVE the catch-all `*` route in App.tsx.

### Component Organization

- `src/components/` - Application-specific components (PatientCard, PatientDialog, ImageUploadCard, CameraCapture, SearchBar)
- `src/components/ui/` - shadcn/ui components (DO NOT edit manually; use shadcn CLI to update)
- `src/pages/` - Route-level page components
- `src/lib/utils.ts` - Utility functions (currently only contains cn() for className merging)
- `src/hooks/` - Custom React hooks

### Image Handling

Images are stored as base64-encoded data URLs in-memory (within the Patient object's `images` property). This is for demo purposes only.

- **ImageUploadCard**: Supports both camera capture and file upload
- **CameraCapture**: Full-screen camera interface with front/back camera switching
- **File Validation**: Max 5MB, images only
- **Storage**: Base64 encoded in the patient object (images.face, images.ear, images.foot, images.palm)

### Patient Data Model

```typescript
interface Patient {
  id: string;
  babyName: string;
  motherName: string;
  address: string;
  dateAdded: string; // ISO date string
}

interface PatientWithImages extends Patient {
  images?: {
    face?: string;
    ear?: string;
    foot?: string;
    palm?: string;
  };
}
```

### UI Framework

Uses shadcn/ui components built on Radix UI primitives. Key patterns:
- Toast notifications via Sonner library (use `toast.success()`, `toast.error()`)
- Form validation with react-hook-form + Zod resolvers
- Theme system via CSS variables (supports dark mode through next-themes)
- Styling convention: Tailwind utility classes composed with cn() helper

### Path Aliases

Import paths use `@/` alias for `src/` directory (configured in tsconfig.json and vite.config.ts).

Example: `import { Button } from "@/components/ui/button"`

## TypeScript Configuration

- **Relaxed mode**: noImplicitAny, noUnusedParameters, noUnusedLocals, and strictNullChecks are all disabled
- Allow JavaScript files (allowJs: true)
- Skip library type checking (skipLibCheck: true)

## Development Notes

- **Lovable Integration**: This project was created with Lovable and includes the lovable-tagger plugin for development builds
- **Vite Dev Server**: Runs on port 8080 with IPv6 support (host: "::")
- **ESLint**: React Hooks rules enforced; unused variables warnings disabled
- **Camera API**: Uses navigator.mediaDevices.getUserMedia with facingMode constraints for front/back camera switching
