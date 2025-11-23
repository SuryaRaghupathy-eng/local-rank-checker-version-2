# CSV Data Processor - Google Local Rank Checker

## Overview

A web application designed for processing CSV files containing location and business search queries. It enables users to upload CSVs with keywords, brands, and branch information, which are then used to search the Google Places API. The system performs brand matching on the search results and generates comprehensive, downloadable reports in various formats (CSV, JSON, Excel). The application aims for a clean, efficient, and productivity-focused user experience.

## Recent Updates (November 23, 2025)

### Local SEO Features Added
- **Device Type Tracking**: Mobile vs Desktop vs Tablet ranking differentiation
- **Local Pack Identification**: Automatically flags top 3 results as "Local Pack" positions
- **Geo-Grid Support**: Single-point geo-targeting with latitude/longitude coordinates
- **Enhanced Database Schema**: Stores device type, Local Pack flags, and search coordinates

## Setup Status

✅ Database: PostgreSQL provisioned and schema migrated
✅ API Key: SERPER_API_KEY configured
✅ Workflow: Running on port 5000
✅ Deployment: Configured for autoscale deployment
✅ Local SEO Features: Device type, Local Pack tracking, Geo-grid (single point)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for bundling, Wouter for routing, and TanStack Query for data fetching. It leverages Shadcn/UI (built on Radix UI) and Tailwind CSS for a modern, responsive design with a custom theme supporting light/dark mode. State management primarily uses local component state, tracking processing statuses and real-time statistics. Key features include drag-and-drop CSV upload, file preview with validation, real-time processing status, results preview, and export options.

### Backend Architecture

The backend is an Express.js server developed with TypeScript and ES Modules. It uses `tsx` for development and `esbuild` for production bundling. Key functionalities include a POST `/api/process-csv` endpoint for CSV file processing, `Multer` for file uploads (10MB limit), and `Papaparse` for robust CSV parsing. It integrates with the Serper API for Google Places searches, supporting pagination and implementing a brand matching algorithm that normalizes titles to check for brand and branch presence. An `IStorage` interface is defined for data persistence, currently implemented with in-memory storage (MemStorage), but designed for future PostgreSQL integration using Drizzle ORM.

### Data Storage Solutions

The application currently uses in-memory storage (JavaScript Map) for non-persistent data. However, it is prepared for PostgreSQL integration with `Drizzle ORM`, schema definitions (`projects`, `searches`, `ranking_results` tables), and environment-based configuration, allowing a seamless transition to persistent storage.

## External Dependencies

- **UI Components:** Radix UI primitives, Shadcn/UI, Class Variance Authority (CVA), Lucide React (icons).
- **Form Handling:** React Hook Form, Hookform/resolvers, Zod (for validation).
- **Styling:** Tailwind CSS, PostCSS.
- **Date Handling:** `date-fns`.
- **API Integration:** Serper API (Google Places searches), Papaparse (CSV parsing).
- **Development Tools:** Vite, esbuild, TypeScript, Replit-specific Vite plugins.