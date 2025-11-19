# CSV Data Processor

## Overview

A web application for processing CSV files containing location and business search queries. Users upload CSV files with keywords, brands, and branch information, which are then used to search Google Places API. The system performs brand matching on results and provides comprehensive downloadable reports in multiple formats (CSV, JSON, Excel).

The application is designed with a clean, productivity-focused interface inspired by modern tools like Linear and Dropbox, emphasizing clarity and efficiency in data processing workflows.

## Recent Changes

**November 19, 2025 - BrightLocal-Inspired Features Added:**
- Implemented PostgreSQL database integration for persistent ranking history
- Created database schema with `projects`, `searches`, and `ranking_results` tables
- Added database indexes for optimized query performance (project_id, search_id, query/brand/branch combinations)
- Built comprehensive storage layer with PostgreSQL and MemStorage implementations
- Updated CSV processing to save all results to database while maintaining backwards compatibility
- Created API endpoints for historical data retrieval (projects, searches, ranking history)
- Built comprehensive History dashboard UI with search history, result details, and ranking trend charts
- Added navigation link to History page in Dashboard Header
- Database automatically switches between PostgreSQL and in-memory storage based on environment
- Performance optimized with database indexes on frequently queried columns

**November 17, 2025 - Fresh GitHub Import Setup:**
- Successfully imported project from GitHub as a fresh clone
- Installed all 492 npm dependencies
- Configured SERPER_API_KEY environment secret for Google Places API integration
- Created development workflow running `npm run dev` on port 5000 with webview output
- Configured autoscale deployment with build (`npm run build`) and run (`npm run start`) commands
- Verified application fully functional: CSV upload interface, country/language selectors, theme toggle
- Vite configuration already optimized for Replit proxy with `allowedHosts: true` and HMR settings
- Server configured to bind to 0.0.0.0:5000 for frontend access
- All existing features working: real-time SSE progress tracking, brand matching, file previews, downloads
- Application ready for use in Replit environment

**November 15, 2025 - Replit Environment Setup Completed:**
- Successfully set up GitHub import in Replit environment
- Installed all 492 npm dependencies
- Configured SERPER_API_KEY environment secret for Google Places API integration
- Created development workflow running `npm run dev` on port 5000 with webview output
- Configured autoscale deployment with build (`npm run build`) and run (`npm run start`) commands
- Verified application fully functional: CSV upload interface, country/language selectors, theme toggle
- Vite configuration already optimized for Replit proxy with `allowedHosts: true` and HMR settings
- Server configured to bind to 0.0.0.0:5000 for frontend access
- All existing features working: real-time SSE progress tracking, brand matching, file previews, downloads

**November 15, 2025 - Fixed SSE Progress Tracking:**
- Fixed Server-Sent Events (SSE) streaming to properly display real-time progress
- Added `res.flushHeaders()` to ensure browser immediately recognizes streaming response
- Added `req.socket.setNoDelay(true)` to disable TCP buffering (Nagle's algorithm)
- Added `req.socket.setTimeout(0)` to prevent socket timeouts during long processing
- Added `X-Accel-Buffering: no` header to disable proxy buffering
- Added initial progress event (0 / N queries) sent immediately when processing starts
- Frontend now correctly receives and displays live progress updates during CSV processing
- Progress bar updates show current query, queries processed, queries per second, and estimated time remaining
- Each keyword's progress now appears immediately after it's processed, not at the end

**November 15, 2025 - Real-Time Progress Tracking:**
- Added Server-Sent Events (SSE) streaming endpoint `/api/process-csv-stream` for real-time progress updates
- Processing status now shows exactly which keyword is being processed (e.g., "Processing 3 out of 10")
- Live updates include:
  - Current keyword being searched
  - Number of keywords processed vs total (e.g., "3 / 10 queries")
  - Processing speed (queries per second)
  - Estimated time remaining
  - Current page being fetched from Google Places API
  - Total API calls made
- Progress bar updates in real-time as each keyword is processed
- Frontend uses streaming fetch API to consume SSE events and update UI instantly
- Backend sends progress updates before and after each keyword search
- Maintained backward compatibility with old `/api/process-csv` endpoint

**November 15, 2025 - Enhanced File Upload Preview:**
- CSV file preview now shows ALL uploaded data instead of just first 5 rows
- Added "Show More" / "Show Less" toggle button for expandable preview
  - Initially shows first 5 keywords for quick overview
  - Click "Show More" to expand and view all uploaded keywords
  - Shows count of remaining keywords (e.g., "Show More (45 more)")
- Added keyword count display showing total number of keywords uploaded
- Preview automatically filters empty rows for cleaner display
- Maximum preview height set to prevent overwhelming UI with large files

**November 15, 2025 - "Brand not found" Preview & Download Enhancement:**
- Updated results preview to show "Brand not found" for queries without any brand matches
- When a query has no brand match (all brand_match values are false), it now displays:
  - Title: "Brand not found" (instead of showing position 1 non-matching result)
  - Query: The original search query used
  - Ranking Position: "N/A" (instead of showing position number)
- Backend creates "Brand not found" entries with N/A ranking for queries without matches
- Frontend preview logic prioritizes showing these N/A entries over regular non-matching results
- Both download options (All Data & Matches Only) now include "Brand not found" entries
- Ensures users immediately know which queries didn't find their brand in both preview and downloads

**November 15, 2025 - N/A Ranking Support & Language Selector:**
- Added "N/A" display for queries without brand match rankings
- All uploaded queries now appear in results, even if no brand match is found
- Backend tracks brand matches and adds N/A entries for queries without results
- Preview display shows all queries with best ranking or N/A
- "Matches Only" download includes all queries grouped by best ranking (or N/A)
- Added language dropdown selector with 192+ languages (ISO codes) for precise search results
- Language parameter (hl) now passed to Serper API alongside country (gl) parameter
- Created client/src/lib/languages.ts with comprehensive language data structure
- Updated Dashboard component to include language selection with default to English (en)
- Backend routes.ts updated to accept and use language parameter in API calls
- Successfully imported project from GitHub repository as a fresh clone
- Installed all npm dependencies (492 packages)
- Vite configuration already includes `allowedHosts: true` for Replit proxy compatibility
- Server configured to run on 0.0.0.0:5000 (frontend) with proper host settings
- Configured development workflow (`npm run dev`) with webview output on port 5000
- Requested and configured SERPER_API_KEY environment secret for Google Places API
- Configured deployment for autoscale deployment target with build and run commands
- Application fully tested and working: CSV upload interface with country and language selectors
- Database support available (Drizzle ORM + PostgreSQL schema defined) but currently using in-memory storage
- Ready for production deployment with all Replit configurations in place

**January 6, 2025 - Backend Integration & Migration:**
- Migrated from Replit Agent to Replit environment
- Implemented backend CSV processing with real-time Serper API integration
- Added secure API key management via SERPER_API_KEY environment variable
- Installed multer (with @types/multer) for file upload handling with 10MB size limit
- Installed Papaparse (with @types/papaparse) for robust CSV parsing supporting quoted fields
- Created POST /api/process-csv endpoint for file processing
- Connected frontend to backend with real API calls, removing all mock data
- Implemented full data export functionality (CSV, JSON, brand matches)
- Added proper error handling for API failures and validation errors

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for data fetching and state management
- Shadcn/UI component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system

**Design System:**
- Custom theme with light/dark mode support
- Typography based on Inter font from Google Fonts
- Spacing primitives using Tailwind units (4, 6, 8, 12)
- Component-based design with consistent elevation patterns
- Color system using CSS variables for theme customization
- Max container width: 4xl (centered layout)

**State Management:**
- Local component state for UI interactions
- Processing states tracked through enum: 'idle', 'previewing', 'processing', 'complete', 'error'
- File processing history maintained in component state
- Real-time processing statistics (queries per second, estimated time remaining, current progress)

**Key Features:**
- Drag-and-drop CSV file upload
- File preview with data validation
- Real-time processing status with detailed statistics
- Results preview with expandable data table
- Export options: CSV (full results) and Matches Only (brand matches)
- Processing history with download capabilities
- Theme toggle (light/dark mode)
- Responsive design for mobile and desktop

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- ESM (ES Modules) throughout the codebase
- Development: tsx for TypeScript execution
- Production: esbuild for bundling
- Multer for file upload handling (10MB limit)
- Papaparse for CSV parsing with quoted field support
- Serper API for Google Places searches

**Server Structure:**
- POST /api/process-csv endpoint for CSV file processing
- Serper API integration with pagination support
- Brand matching algorithm (normalizes and checks brand+branch in titles)
- In-memory storage implementation (MemStorage class)
- Vite middleware integration for development mode
- Custom logging middleware for API request tracking
- Raw body capture for request verification

**CSV Processing:**
- Accepts CSV files with Keywords, Brand, and Branch columns (case-insensitive)
- Searches Google Places API via Serper for each query
- Fetches all available pages of results (1 second delay between requests)
- Performs brand matching by normalizing titles and checking for brand+branch presence
- Returns full results with brand_match boolean flags
- Supports downloading results as CSV, JSON, or brand-matches-only CSV

**Storage Interface:**
- IStorage interface defining CRUD operations
- Currently implements user management (getUser, getUserByUsername, createUser)
- Uses Map-based in-memory storage with UUID generation
- Designed to be replaced with database implementation

### Data Storage Solutions

**Current Implementation:**
- In-memory storage using JavaScript Map
- No persistent database currently configured

**Database Configuration (Prepared but not active):**
- Drizzle ORM configured for PostgreSQL
- Schema defined in shared/schema.ts with users table
- Connection configured through DATABASE_URL environment variable
- Neon serverless PostgreSQL adapter included in dependencies
- Migration setup using drizzle-kit

**Schema Structure:**
- Users table: id (UUID), username (unique), password
- Zod validation schemas for type safety

### External Dependencies

**UI Component Library:**
- Radix UI primitives for accessible components (accordion, dialog, dropdown-menu, popover, select, tabs, toast, tooltip, etc.)
- Shadcn/UI configuration for component customization
- Class Variance Authority (CVA) for component variants
- Lucide React for icons

**Form Handling:**
- React Hook Form for form management
- Hookform/resolvers for validation integration
- Zod for schema validation (via drizzle-zod)

**Styling:**
- Tailwind CSS with PostCSS
- Custom theme configuration with CSS variables
- Support for dark mode via class strategy

**Date Handling:**
- date-fns for date formatting and manipulation

**Development Tools:**
- Replit-specific plugins for development (vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner)
- TypeScript for type safety across frontend and backend
- Path aliases configured for cleaner imports (@/, @shared/, @assets/)

**API Integration:**
- Serper API for Google Places searches (production implementation)
- Papaparse for robust CSV parsing with quoted field support
- Multi-page result fetching with 1-second rate limiting between requests
- Secure API key management via environment variables

**Session Management:**
- connect-pg-simple package included for PostgreSQL session storage (not currently implemented)

**Build & Deployment:**
- Vite for frontend bundling
- esbuild for server-side bundling
- Separate build outputs: dist/public (frontend), dist (backend)
- Node.js runtime in production mode