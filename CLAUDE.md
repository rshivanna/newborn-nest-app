# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Newborn Gestation Age Estimation Data Collection Tool** - a full-stack medical application for collecting newborn patient data and medical photos (skin, lanugo, foot, eye/ear) with assessments. Built with React (Vite) frontend and Express.js backend, using file-based JSON storage.

## Development Commands

### Frontend (Vite + React + TypeScript)
```bash
npm run dev         # Start dev server on http://localhost:8080
npm run build       # Production build
npm run build:dev   # Development build with sourcemaps
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

### Backend (Node.js + Express)
```bash
cd backend
npm run dev         # Start backend with watch mode (node --watch server.js)
npm start           # Start backend (production)
```

### Running Both
- Frontend runs on port 8080 (configured in vite.config.ts)
- Backend runs on port 5000 (configured in backend/server.js)
- Frontend proxies `/api` requests to backend (see vite.config.ts proxy config)

## Architecture

### Frontend Structure
- **Pages**:
  - `src/pages/Index.tsx` - Main dashboard with patient list, search, and add patient dialog
  - `src/pages/PatientDetail.tsx` - Patient detail page with image upload and assessment dropdowns
  - `src/pages/NotFound.tsx` - 404 page
- **Components**:
  - `src/components/PatientCard.tsx` - Patient card display
  - `src/components/PatientDialog.tsx` - Add/edit patient form dialog
  - `src/components/ImageUploadCard.tsx` - Image upload component with camera support
  - `src/components/CameraCapture.tsx` - Camera capture functionality
  - `src/components/ui/*` - shadcn/ui components
- **API Client**: `src/services/api.ts` - All backend API calls using fetch
- **Routing**: React Router v6 with routes defined in `src/App.tsx`
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui components

### Backend Structure
- **Server**: `backend/server.js` - Express server with CORS, helmet, morgan
- **Routes**: `backend/routes/patient.js` - All patient CRUD endpoints
- **Middleware**:
  - `backend/middleware/upload.js` - Multer configuration for image uploads
  - `backend/middleware/errorHandler.js` - Global error handling
- **Utils**: `backend/utils/fileHandler.js` - File system operations (create folders, save JSON, handle images)
- **Data Storage**: File-based in `data/` directory (each patient gets a folder with JSON + images)

### Data Flow
1. **Patient Creation**: Frontend form → FormData → Backend creates folder in `data/` → Saves JSON + images → Returns patient data
2. **Image Upload**: Frontend captures/uploads image → Base64 → Converted to File → Sent to backend → Saved to patient folder → JSON updated
3. **Patient Retrieval**: Backend scans `data/` folder → Reads all patient JSONs → Returns list to frontend
4. **Image Serving**: Backend serves images from `data/` via `/uploads` static route

### Key Data Models
```typescript
PatientData {
  id: string
  babyName: string
  motherName: string
  address: string
  babyDetails: {
    gestationalAge: string  // Required field (20-42 weeks)
    weightKg: number | null
    sex: 'male' | 'female' | ''
    heartRateBpm: number | null
    temperatureC: number | null
  }
  maternalDetails: {
    maternalAgeYears: number | null
    parity: string
    location: string
    maternalEducation: string
    deliveryMode: 'normal' | 'cesarean' | 'assisted' | ''
    gestationalHistory: string
    gestationalAgeEstimationMethod: 'LMB' | 'Ultra sound' | 'Ballard score' | 'other' | ''
  }
  images?: {
    face?: string    // Skin photo
    ear?: string     // Lanugo photo
    foot?: string    // Foot photo
    palm?: string    // Eye/Ear photo
  }
  assessments?: {
    face?: string    // Skin assessment
    ear?: string     // Lanugo assessment
    foot?: string    // Foot assessment
    palm?: string    // Eye/Ear assessment
  }
  folderName: string
  createdAt: string
  updatedAt: string
}
```

### Assessment Options
- **Skin (face)**: 7 options from "Sticky friable, transparent" to "Leathery, cracked, wrinkled"
- **Lanugo (ear)**: 6 options from "None" to "Mostly bald"
- **Foot**: 5 options from "no crease" to "Creases over entire sole"
- **Eye/Ear (palm)**: 7 options from "Lids fused loosely" to "Thick cartilage, ear stiff"

(See `src/pages/PatientDetail.tsx:19-53` for complete assessment options)

## Path Aliases

```typescript
@/* → ./src/*
```

Configured in:
- `tsconfig.json` - TypeScript path resolution
- `vite.config.ts` - Vite module resolution
- `components.json` - shadcn/ui component paths

## Important Implementation Notes

1. **Image Type Mapping**: The backend uses generic names (face, ear, foot, palm) but the UI displays medical terms:
   - `face` → "Skin Photo"
   - `ear` → "Lanugo Photo"
   - `foot` → "Foot Photo"
   - `palm` → "Eye/Ear Photo"

   See `src/pages/PatientDetail.tsx:106-114` for the mapping function.

2. **Image URLs**: Images are served from backend at `/uploads/{folderName}/{imageName}`. The `getImageUrl()` function in `src/services/api.ts:239` constructs the full URL.

3. **Form Validation**: PatientDialog component has field-level validation with specific ranges:
   - Baby weight: 0.5-6 kg
   - Heart rate: 100-180 bpm
   - Temperature: 35-38°C
   - Maternal age: 12-60 years
   - Parity: 0-20
   - Gestational age: 20-42 weeks (required)

4. **File Storage**: Each patient has a unique folder in `data/` directory named `{babyName}_{timestamp}`. The folder contains:
   - `patient.json` - Patient data
   - Image files named `{folderName}_{imageType}{extension}` (e.g., `BabyJohn_1234567890_face.jpg`)

5. **React Query**: All API calls use TanStack Query with query keys:
   - `['patients']` - All patients list
   - `['patient', id]` - Individual patient data

6. **CORS Configuration**: Backend allows all localhost ports in development (see `backend/server.js:36-63`)

## Environment Variables

### Frontend
- `VITE_API_URL` - Backend API URL (default: `http://localhost:5000/api`)

### Backend
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

## shadcn/ui Components

This project uses shadcn/ui components. To add new components:
```bash
npx shadcn@latest add [component-name]
```

Components are installed to `src/components/ui/` with configuration in `components.json`.

## TypeScript Configuration

The project has relaxed TypeScript settings for rapid development:
- `noImplicitAny: false`
- `strictNullChecks: false`
- `noUnusedLocals: false`
- `noUnusedParameters: false`

These can be tightened for production.
