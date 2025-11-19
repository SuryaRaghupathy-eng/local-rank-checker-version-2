# Design Guidelines: CSV Processing Dashboard

## Design Approach
**System-Based Approach** - Clean, utility-focused design inspired by modern productivity tools like Linear and Dropbox. Emphasis on clarity, efficiency, and professional presentation of data processing workflows.

**Design Principles:**
- Clarity over decoration - every element serves the user's workflow
- Progressive disclosure - show information as needed during the process
- Professional confidence - instill trust in data handling
- Immediate feedback - clear visual states for all interactions

---

## Core Design Elements

### A. Typography
**Font Stack:** Inter (Google Fonts)
- **Headings:** 
  - H1: 32px (2xl), semibold - Page title
  - H2: 24px (xl), semibold - Section headers
  - H3: 18px (lg), medium - Subsections
- **Body:** 
  - Primary: 16px (base), regular - Main content
  - Secondary: 14px (sm), regular - Helper text, labels
  - Small: 12px (xs), regular - Metadata, timestamps
- **Code/Data:** 
  - Mono: 14px (sm), monospace font family for file names, data preview

### B. Layout System
**Spacing Primitives:** Use Tailwind units of **4, 6, 8, 12** for consistent rhythm
- Component padding: p-6 or p-8
- Section spacing: space-y-8 or space-y-12
- Card gaps: gap-6
- Button padding: px-6 py-3

**Grid Structure:**
- Max container width: max-w-4xl (centered)
- Single column layout for simplicity
- Component cards with subtle elevation

### C. Component Library

**1. File Upload Zone**
- Large dashed border area (min-h-64)
- Center-aligned icon (upload cloud icon, size: 48px)
- Primary text: "Drop your CSV file here or click to browse"
- Secondary text: "Accepts .csv files up to 10MB"
- Drag-over state: solid border, subtle background tint
- File selected state: Show file icon, name, size, remove button

**2. File Preview Card** (After upload, before processing)
- Compact card layout
- File icon + name + size display
- Quick CSV preview: First 3-5 rows in table format
- Action buttons: "Process File" (primary), "Remove" (secondary)

**3. Processing Status**
- Progress bar with percentage
- Status text: "Processing your file..." 
- Animated spinner or progress indicator
- Step indicators if multiple stages exist

**4. Results Section**
- Success message card
- File statistics: "Processed X queries, found Y results"
- Download buttons side-by-side:
  - "Download CSV" (primary button)
  - "Download JSON" (secondary button)
- Optional: Quick preview of results in collapsed table

**5. Error Handling**
- Alert card with icon
- Clear error message
- Suggested actions: "Please check your CSV format" with link to sample
- "Try Again" button

**6. Navigation/Header**
- Simple top bar with app name/logo
- Optional: Info/Help button (icon only)
- Height: h-16, subtle bottom border

**7. Buttons**
- Primary: Solid background, white text, rounded-md, px-6 py-3
- Secondary: Border only, rounded-md, px-6 py-3
- Ghost/Danger: Text only with colored text for destructive actions
- All buttons: medium font-weight, subtle shadow on hover

**8. Cards**
- Background: Subtle from page background
- Border: 1px solid border
- Rounded: rounded-lg
- Padding: p-6 or p-8
- Shadow: Subtle shadow for elevation

**9. Table Component** (for CSV preview)
- Header row: Semibold, subtle background
- Alternating row backgrounds for readability
- Cell padding: px-4 py-3
- Responsive: Horizontal scroll on mobile

### D. Page Structure

**Main Dashboard View:**
1. **Header** (h-16): App title + optional help icon
2. **Hero Section** (py-12): 
   - Centered heading: "CSV Data Processor"
   - Subheading: "Upload, process, and download your results"
3. **Upload Section** (py-8):
   - File upload zone (central focus)
   - Sample CSV download link below
4. **Processing/Results Section** (py-8):
   - Conditionally rendered based on state
   - Empty state when no file uploaded
5. **Footer** (py-6): 
   - Minimal - powered by info or simple links

**State Management:**
- **Empty State:** Show upload zone prominently
- **File Selected:** Show preview card + process button
- **Processing:** Show progress indicator
- **Complete:** Show results + download options
- **Error:** Show error card + retry option

### E. Animations
**Minimal and Purposeful:**
- File upload zone: Subtle scale on drag-over (scale-105)
- Buttons: Simple opacity transition on hover
- Progress bar: Smooth fill animation
- Card appearances: Simple fade-in (no complex animations)
- **No excessive motion** - keep it professional

---

## Images
**No hero images required** for this utility dashboard. The interface is function-first with clean iconography:
- Upload cloud icon (within upload zone)
- File type icons (CSV, JSON)
- Success/error icons in alerts
- Use icon library: Heroicons (outline style for consistency)

---

## Mobile Responsiveness
- Upload zone: Reduce height on mobile (min-h-48)
- Tables: Horizontal scroll in container
- Buttons: Full width on mobile (w-full on sm screens)
- Reduce padding: p-4 instead of p-8 on mobile
- Stack download buttons vertically on small screens

---

## Key User Flows
1. **Upload:** Drag file → See preview → Click "Process"
2. **Processing:** See progress → Wait for completion
3. **Download:** Click download buttons → Success message
4. **Error Recovery:** See error → Understand issue → Retry with corrected file

**Professional, efficient, and trustworthy** - the design should feel like a reliable tool built by professionals.