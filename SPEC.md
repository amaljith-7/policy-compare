# PROMINENT — Application Specification

> **Insurance Broker Internal Tool**
> Version 1.0 · March 2026 · Draft

---

## 1. Executive Summary

Prominent is an internal tool for insurance brokers. It acts as a bridge between insurers and customers. When a customer requests insurance, the broker collects quotes from multiple insurers, uploads their PDF quote documents, and the system extracts key data using AI. The broker then reviews a side-by-side comparison, edits as needed, and shares it with the customer via WhatsApp or Email so they can choose the best option.

### Core Value Proposition

- **Automated PDF extraction** — AI reads insurer quote PDFs and extracts structured data. No manual data entry.
- **Side-by-side comparison** — Horizontal preview mode and single-insurer focus mode for easy evaluation.
- **One-click sharing** — Share comparisons via WhatsApp or Email. Download as PDF directly from the browser.
- **Full audit trail** — Every quote is stored and revisitable with status tracking from creation to close.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PDF storage | **Not stored** | PDFs are throwaway — uploaded, extracted via AI, then discarded. Only the extracted JSON data is persisted in the database. |
| Comparison data | **Stored as JSON in DB** | The `comparison_data` JSON field on the Quote model holds all extracted + edited data. This is the single source of truth for revisiting comparisons. |
| PDF download | **Client-side generation** | The comparison view is already rendered in the browser. `html2pdf.js` converts the on-screen table directly to PDF. No server-side PDF generation. |
| File storage | **Django media folder only** | The only persisted files are insurer logos. Simple `MEDIA_ROOT` storage. No S3/cloud needed. |
| PDF extraction | **Claude API (Anthropic)** | LLM-based extraction handles layout variations across insurers without per-insurer parsing rules. |

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend Framework | Next.js 14+ (App Router) | React 18, TypeScript, Server & Client Components |
| Styling | Tailwind CSS + shadcn/ui | Material Design-inspired theming with paper cards, elevation shadows, ripple effects |
| State Management | Zustand + TanStack Query | Zustand for UI state, TanStack Query for server state & caching |
| Forms | React Hook Form + Zod | Schema-validated forms with type-safe validation |
| Backend | Django 5+ (REST Framework) | API-first architecture, Django REST Framework for all endpoints |
| Database | SQLite (dev) → PostgreSQL (prod) | SQLite for development speed, PostgreSQL-ready models for production |
| PDF Extraction | Claude API (Anthropic) | LLM-based structured extraction from insurer PDFs |
| PDF Download | html2pdf.js | Client-side browser PDF generation from the rendered comparison view |
| Auth | Django session auth + JWT tokens | Session-based with JWT for API calls from Next.js |
| File Storage | Django media folder | Only used for insurer logos |

---

## 3. Design System

Follow Google Material Design 3 principles. The UI should feel clean, professional, and modern — not generic or "AI-generated" looking.

### 3.1 Core Principles

- **Paper-like cards** — Content grouped in elevated card surfaces with subtle shadows (`shadow-sm`, `shadow-md`).
- **Bold primary colors** — Blue (`#1A73E8`) primary, Green (`#34A853`) for success, Red (`#EA4335`) for destructive actions.
- **Elevation hierarchy** — Shadow depth communicates focus and importance (modals at `shadow-xl`, cards at `shadow-sm`).
- **Responsive micro-interactions** — Ripple effects on buttons, smooth transitions (150–300ms ease), hover lifts on cards.
- **Consistent 8px grid** — All spacing, padding, and sizing aligned to an 8px base grid.
- **Typography** — Inter or Google Sans as primary typeface, following Material type scale.

### 3.2 Component Patterns

- **Buttons** — Flat/filled with hover darkening, ripple animation on click. No outlines for primary actions.
- **Tables** — Clean rows with subtle row-hover highlights, sticky headers, ample cell padding.
- **Modals** — Centered overlay with backdrop blur, smooth scale-in animation, clear close affordance.
- **Status badges** — Pill-shaped, color-coded: New (blue), Submitted (indigo), In Discussion (amber), Hold (gray), Closed Won (green), Closed Lost (red).
- **Filter chips** — Rounded pill toggles with active/inactive states, used for insurer filtering in comparison views.

---

## 4. System Architecture

### 4.1 High-Level Flow

```
User uploads PDFs → Django sends to Claude API → AI returns JSON →
JSON stored in DB as comparison_data → Browser renders comparison table →
User edits inline (auto-saved) → User downloads PDF from browser (html2pdf.js)
```

No files are persisted except insurer logos. The database is the single source of truth.

### 4.2 Frontend Structure (Next.js)

```
prominent-web/
├── app/                    # App Router pages
│   ├── (auth)/             # Login page
│   ├── dashboard/          # Dashboard (Phase 4)
│   ├── quotes/             # Quotes module
│   ├── insurers/           # Insurer configuration
│   └── users/              # User management
├── components/
│   ├── quotes/             # Quote table, comparison modal, notes panel
│   ├── insurers/           # Insurer table, add/edit modal
│   ├── users/              # User table, add/edit modal
│   └── shared/             # Layout, sidebar, top bar, status badges, filter chips
├── lib/                    # Axios client, utils, constants, types
├── hooks/                  # useQuotes, useInsurers, useAuth, etc.
├── stores/                 # Zustand stores (uiStore, quoteComparisonStore)
└── styles/                 # Tailwind config, global styles
```

### 4.3 Backend Structure (Django)

```
prominent-api/
├── core/                   # Settings, base models, permissions, middleware
├── quotes/                 # Quote CRUD, comparison logic, PDF extraction service
├── insurers/               # Insurer CRUD, logo upload
├── users/                  # User management, RBAC, auth endpoints
└── sharing/                # WhatsApp & Email sharing service (abstract)
```

---

## 5. Data Models

### 5.1 User

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| full_name | CharField(255) | Required |
| email | EmailField (unique) | Used for login |
| password | CharField (hashed) | Django's built-in password hashing |
| role | ForeignKey → Role | RBAC role assignment |
| is_active | BooleanField | Active / Inactive toggle |
| created_at | DateTimeField | Auto-set |
| updated_at | DateTimeField | Auto-set |

### 5.2 Role (RBAC)

A flexible role-based access control system. Roles define a set of permissions. Users are assigned one role. Permissions are checked at the API level via DRF permission classes.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | CharField(100) | e.g., "Admin", "Agent", "Viewer" |
| permissions | JSONField | List of permission strings |
| is_default | BooleanField | Auto-assigned to new users |
| created_at | DateTimeField | Auto-set |

**Permission Strings:**

| Permission | Description |
|-----------|-------------|
| quotes.create | Create new quote comparisons |
| quotes.view | View quotes and comparisons |
| quotes.edit | Edit quote data and status |
| quotes.delete | Delete quotes |
| quotes.share | Share quotes via WhatsApp/Email |
| insurers.manage | Add, edit, enable/disable insurers |
| users.manage | Add, edit, disable users and assign roles |
| roles.manage | Create and edit roles and permissions |

### 5.3 Insurer

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | CharField(255) | Insurer display name |
| logo | ImageField (nullable) | Stored in Django media folder |
| is_enabled | BooleanField | Toggle to show/hide in quote creation flow |
| created_at | DateTimeField | Auto-set |

### 5.4 Quote

A Quote represents a single comparison session. It contains one customer, one product type, and multiple insurer comparisons. The full comparison data is stored as JSON for revisiting.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| quote_no | CharField (unique) | Auto-generated, format: QT-001, QT-002, etc. |
| customer_name | CharField(255) | Extracted from first PDF or entered manually |
| product_type | CharField | Enum: MOTOR, BUSINESS, HEALTH, LIFE |
| insurers | ManyToMany → Insurer | All insurers included in this comparison |
| status | CharField | Enum: NEW, SUBMITTED, IN_DISCUSSION, HOLD, CLOSED_WON, CLOSED_LOST |
| owned_by | ForeignKey → User | The agent/admin who created this quote |
| notes | TextField (nullable) | Free-text notes added by the user |
| comparison_data | JSONField | Full extracted + edited comparison data (see Section 5.5) |
| created_at | DateTimeField | Auto-set |
| updated_at | DateTimeField | Auto-set |

### 5.5 comparison_data JSON Structure

This is the single source of truth for all comparison data. Stored on the Quote model. No separate QuoteItem model needed.

```json
{
  "insurers": [
    {
      "insurer_id": "uuid-of-insurer",
      "insurer_name": "ABC Insurance",
      "fields": {
        "customer_name": "John Doe",
        "insured_name": "John Doe",
        "email": "john@example.com",
        "mobile_number": "+971501234567",
        "policy_type": "Comprehensive",
        "premium": 2500.00,
        "vat_5_percent": 125.00,
        "excess": 500.00,
        "total_payable": 2625.00,
        "insured_value": 85000.00
      }
    },
    {
      "insurer_id": "uuid-of-another-insurer",
      "insurer_name": "XYZ Insurance",
      "fields": { ... }
    }
  ]
}
```

When the user revisits a quote via "View Details", this JSON is loaded and the comparison table is re-rendered from it. All edits update this JSON and are auto-saved to the backend.

---

## 6. Application Modules

### 6.1 Authentication

Standard email + password login. Django handles session creation and issues a JWT token for the Next.js frontend.No public registration — users are created by admins only.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | Email + password login, returns JWT |
| POST | /api/auth/logout/ | Invalidate session |
| GET | /api/auth/me/ | Get current user profile + role + permissions |

### 6.2 Dashboard

To be developed in a later phase. Will display summary metrics: total quotes, quotes by status, quotes by product type, recent activity feed, and performance by agent.

### 6.3 Quotes Module

The core module of the application. Displays all quotes in a data table with filtering, status management, note-taking, and the full quote comparison flow.

#### 6.3.1 Quotes Table

Main view is a paginated, sortable data table.

| Column | Source | Behavior |
|--------|--------|----------|
| Quote No | Auto-generated (QT-001) | Sequential, read-only, clickable to open comparison details |
| Customer Name | Extracted from PDF | Display only in table |
| Insurer(s) | Insurer Config module | All insurers in this comparison, comma-separated |
| Product | Product dropdown | Motor / Business / Health / Life |
| Owned By | Creating user | The agent/admin who created the quote |
| Status | Editable dropdown | Inline status change (see 6.3.2) |
| Actions | Dropdown menu | View Details, Share to WhatsApp, Share to Email |

#### 6.3.2 Quote Status Lifecycle

Status is user-editable at any time via inline dropdown. The only automatic transition is New → Submitted, which triggers when a quote is shared via WhatsApp or Email.

| Status | Color | Trigger |
|--------|-------|---------|
| New | Blue | Default on creation |
| Submitted | Indigo | Auto-set after sharing via WhatsApp or Email |
| In Discussion | Amber | Manual — set by user |
| Hold | Gray | Manual — set by user |
| Closed Won | Green | Manual — set by user |
| Closed Lost | Red | Manual — set by user |

#### 6.3.3 Quotes Filters

- **Owned By** — Dropdown with all users. Logged-in user sees a special "Owned by me" option at the top for quick self-filtering.
- **Status** — Multi-select chips to filter by one or more statuses.
- **Product** — Dropdown to filter by product type.
- **Search** — Free-text search across Quote No, Customer Name, and Insurer names.

#### 6.3.4 Notes Panel

Each quote has a notes panel that slides in from the **right side of the screen**. Contains a free-text area for adding contextual notes (e.g., "Customer prefers lower excess", "Follow up on Monday"). Notes are **auto-saved** on change (debounced). The panel is toggled via a notes icon button in the quote detail view or via the actions dropdown.

#### 6.3.5 View Details

Clicking "View Details" (or the Quote No) reopens the full comparison view for that quote. All previously extracted and edited data is loaded from the stored `comparison_data` JSON field. The user can re-enter edit mode, change data, update status, or re-share.

---

### 6.4 Compare New Quote Flow

This is the primary workflow of the application. It opens as a **full-screen modal** (not a page navigation). The flow has three stages.

#### Stage 1: Upload

Triggered by clicking the **"Compare New Quote"** button in the Quotes module.

- **Product type dropdown** — Visible at the top. Options: Motor Insurance, Business Insurance, Health Insurance, Life Insurance.
- **Insurer upload grid** — **Always visible immediately** (do not wait for product selection). Shows all enabled insurers from the Insurer Configuration module. Each insurer is displayed as a card with the insurer's name, logo, and a **drag-and-drop file upload zone**.
- **Upload behavior** — User drags or clicks to upload one PDF per insurer. Visual feedback: file name display, upload progress indicator, success checkmark. The PDF is held in memory / sent directly to the extraction endpoint. It is **never stored** on the server.
- **Minimum requirement** — At least 2 insurer PDFs must be uploaded before proceeding. The product type must also be selected.
- **Proceed button** — "Proceed to Comparison" button at the bottom. On click, shows a **loading state** (skeleton/shimmer of the comparison table) while PDFs are sent to the backend for AI extraction.

**Important rules:**
- Insurer names are **always** taken from the Insurer Config module (never extracted from PDFs).
- Product type **always** comes from the dropdown selection.
- PDFs are **not stored**. They are sent to the backend, extracted, and discarded.

#### Stage 2: Comparison View

After extraction completes, the modal transitions to the comparison view. This has two sub-modes.

**A) Preview Mode (Horizontal Comparison)**

- Displays all uploaded insurer quotes in a **horizontal table** layout. Each insurer occupies one column. Field names are listed vertically on the left as row headers.
- **Filter chips** — Horizontal row of insurer name chips at the top. Clicking a chip toggles that insurer's column visibility (hide/show). All chips are active by default.
- **Editable fields** — All extracted data cells are **inline-editable**. Clicking a cell enters edit mode. Changes are **auto-saved** (debounced, no manual Save button).
- **Sticky left column** — The field name column stays fixed while scrolling horizontally across insurers.

**B) Focus Mode (One-on-One View)**

- Shows a **single insurer's** data at a time. Field names on the left column, insurer values on the right column.
- **Same visual style** as Preview Mode (consistent card design, not a different layout).
- **Navigation** — Left/right arrow buttons to move between insurers. **Keyboard arrow keys (Left/Right)** also navigate between insurers.
- **Fields aligned** — Left column field labels are properly vertically aligned with their corresponding right column data values.
- **Editable** — All data fields remain inline-editable in Focus Mode.

**Mode Toggle:** A toggle/tab switch at the top allows switching between Preview Mode and Focus Mode.

#### Stage 3: Actions

An action menu is available in both Preview and Focus modes.

| Action | Behavior |
|--------|----------|
| Share to WhatsApp | Generates PDF in browser, opens WhatsApp share with PDF or comparison link |
| Share to Email | Generates PDF in browser, opens email compose with attachment or link |
| Download PDF | Generates PDF in browser using `html2pdf.js` from the rendered comparison view. **Direct download** — no new page or tab. |
| Print | Opens browser print dialog with a print-optimized view of the comparison |

**Auto-save:** When the user closes the comparison modal, all data is automatically saved to the backend. The quote appears as a single row in the Quotes table with the Customer Name and all Insurer names. No manual "Save" button exists anywhere in the flow.

**Status auto-update:** When a quote is shared via WhatsApp or Email, the status automatically changes from "New" to "Submitted".

---

### 6.5 Insurer Configuration Module

Admin-only module for managing the list of available insurers. Insurers configured here appear in the quote comparison upload flow.

**Table Columns:**

| Column | Type | Description |
|--------|------|-------------|
| Insurer Name | Text | Display name |
| Logo | Image thumbnail | Uploaded insurer logo |
| Enabled | Toggle switch | Disabled insurers are hidden from the upload flow |

**Add New Insurer:** "Add Insurer" button opens a modal with fields: Insurer Name (required), Logo upload (optional, stored in Django media folder), Enabled toggle (default: on).

---

### 6.6 User Management Module

Admin-only module for managing system users. Supports the flexible RBAC role system.

**Table Columns:**

| Column | Type | Description |
|--------|------|-------------|
| Name | Text | Full name |
| Email | Text | Login email |
| Role | Badge | Assigned role name (e.g., Admin, Agent) |
| Status | Badge | Active (green) / Inactive (gray) |
| Actions | Dropdown | Edit, Disable/Enable |

**Add New User Modal:** Fields: Full Name (required), Email (required, unique), Password (required, min 8 chars), Role dropdown (required, populated from Role table).

---

## 7. AI-Powered PDF Data Extraction

### 7.1 How It Works

PDF extraction uses the **Claude API (Anthropic)** to read uploaded insurer quote documents and return structured JSON. This handles layout variations, different field naming conventions, and inconsistent formatting across insurers without per-insurer parsing rules.

**Flow:**

1. User uploads PDF in the comparison modal.
2. Frontend sends the PDF file to Django: `POST /api/quotes/extract/`
3. Django converts PDF to base64, sends to Claude API with a structured extraction prompt.
4. Claude returns a JSON object with extracted fields.
5. Django validates the JSON schema and returns structured data to the frontend.
6. Frontend populates the comparison table. User can edit inline.
7. **The PDF is discarded after extraction. It is never stored.**

### 7.2 Extraction Fields

The following fields are extracted from each insurer PDF. The AI is instructed to look for common variations of each field name.

| Field | Variations to Look For | Type |
|-------|----------------------|------|
| Customer Name | "Customer Details", "Customer", "Client Name" | String |
| Insured Name | "Insured Name", "Name of Insured", "Policy Holder" | String |
| Email | "Email", "Email Address", "E-mail" | String |
| Mobile Number | "Phone", "Mobile Number", "Contact Number", "Tel" | String |
| Policy Type | "Policy Type", "Plan Type", "Coverage Type" | String |
| Premium | "Premium", "Base Premium", "Net Premium" | Number |
| VAT (5%) | "VAT", "Tax", "VAT 5%" | Number |
| Excess | "Excess", "Deductible" | Number |
| Total Payable | "Total Payable", "Grand Total", "Total Amount Due" | Number |
| Insured Value | "Insured Value", "Sum Insured", "Coverage Amount" | Number |

### 7.3 Extraction Prompt Strategy

The backend sends a system prompt to Claude instructing it to return **only** a JSON object (no markdown, no preamble) with the exact field keys listed above. The prompt specifies to return `null` for any field not found, and to prefer the most specific value if duplicates exist. JSON schema is enforced on the backend before returning to the frontend.

### 7.4 Error Handling

- **Unreadable PDF** — If the PDF is image-based or corrupted, return an error to the user and allow manual entry for that insurer.
- **Partial extraction** — If some fields can't be found, return `null` for those fields and highlight them in the comparison UI for manual input.
- **API failure** — Retry once. If second attempt fails, show error toast and allow manual entry.

---

## 8. Sharing Flow (WhatsApp & Email)

The sharing flow generates a PDF in the browser from the rendered comparison view and provides it to the user for sharing. The implementation approach (simple deep links vs. full API integration) is to be decided.

### 8.1 Share to WhatsApp

1. User clicks "Share to WhatsApp" from comparison view or quote actions dropdown.
2. Browser generates comparison PDF using `html2pdf.js`.
3. A WhatsApp message is composed with: customer name, product type, and either the PDF (if using WhatsApp Business API) or a link back to the comparison view.
4. Opens in WhatsApp via `wa.me` deep link or WhatsApp Business API.
5. Quote status auto-updates to "Submitted" (if currently "New").

### 8.2 Share to Email

1. User clicks "Share to Email" from comparison view or quote actions dropdown.
2. Browser generates comparison PDF using `html2pdf.js`.
3. Email compose opens with pre-filled subject line (quote number + customer name) and PDF attached or linked.
4. Quote status auto-updates to "Submitted" (if currently "New").

### 8.3 Implementation Options (To Be Decided)

| Approach | WhatsApp | Email | Pros | Cons |
|----------|----------|-------|------|------|
| Simple (MVP) | `wa.me` deep link + text + link to comparison | `mailto:` link with subject | Zero backend integration, fast to build | No PDF attachment, limited control |
| Intermediate | `wa.me` + link | SMTP (SendGrid/Resend) | Proper email attachments | Email service cost |
| Full | WhatsApp Business API | SMTP + templates | Full control, PDF attach everywhere | API costs, WhatsApp approval process |

---

## 9. API Endpoints

### 9.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | Email + password login, returns JWT |
| POST | /api/auth/logout/ | Invalidate session |
| GET | /api/auth/me/ | Current user profile + role + permissions |

### 9.2 Quotes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quotes/ | List all quotes (paginated, filterable by status, product, owned_by) |
| POST | /api/quotes/ | Create a new quote (after comparison flow completes) |
| GET | /api/quotes/:id/ | Get quote details including full comparison_data |
| PATCH | /api/quotes/:id/ | Update quote (status, notes, comparison_data) |
| DELETE | /api/quotes/:id/ | Delete a quote |
| POST | /api/quotes/extract/ | Upload PDF → extract via Claude API → return JSON (PDF not stored) |
| POST | /api/quotes/:id/share/ | Trigger sharing flow, auto-update status |

### 9.3 Insurers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/insurers/ | List all insurers (with optional `enabled` filter) |
| POST | /api/insurers/ | Create new insurer (with logo upload) |
| PATCH | /api/insurers/:id/ | Update insurer (name, logo, enabled) |
| DELETE | /api/insurers/:id/ | Delete insurer |

### 9.4 Users & Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/ | List all users |
| POST | /api/users/ | Create new user |
| PATCH | /api/users/:id/ | Update user (name, email, role, status) |
| GET | /api/roles/ | List all roles with permissions |
| POST | /api/roles/ | Create new role |
| PATCH | /api/roles/:id/ | Update role permissions |

---

## 10. Navigation & Layout

### 10.1 Sidebar Navigation

Persistent left sidebar with the app logo ("Prominent") at the top.

| Item | Icon | Route | Permission |
|------|------|-------|------------|
| Dashboard | LayoutDashboard | /dashboard | quotes.view |
| Quotes | FileText | /quotes | quotes.view |
| Insurers | Building2 | /insurers | insurers.manage |
| Users | Users | /users | users.manage |

### 10.2 Top Bar

Contains: page title (dynamic), search bar (global), notification bell (future), user avatar with dropdown (profile, logout).

---

## 11. Phased Delivery Plan

### Phase 1 — Foundation (Week 1–2)

- Project scaffolding: Next.js frontend + Django backend, DB models, auth system.
- Insurer Configuration module (full CRUD with logo upload and enable/disable).
- User Management module (full CRUD with RBAC role assignment).
- Base layout: sidebar, top bar, routing, permission guards.

### Phase 2 — Core Quoting (Week 3–4)

- Quotes module: data table with sorting, filtering (Owned By, Status, Product), search.
- Compare New Quote modal: upload flow, product selection, insurer grid.
- Claude API integration: PDF upload, extraction, structured JSON response.
- Comparison view: Preview Mode (horizontal) and Focus Mode (single insurer) with inline editing.
- Auto-save on all edits and modal close.

### Phase 3 — Sharing & Polish (Week 5–6)

- Client-side PDF generation via `html2pdf.js`.
- WhatsApp and Email sharing flow (MVP approach first).
- Notes panel (right-side slide-out).
- Status auto-update on share.
- View Details: reload stored comparison data.
- Print view optimization.
- Keyboard navigation in Focus Mode.

### Phase 4 — Dashboard & Enhancements (Week 7+)

- Dashboard with summary cards and charts.
- Advanced filters and saved views.
- Audit log for quote actions.
- Production database migration (SQLite → PostgreSQL).
- WhatsApp Business API integration (if needed).

---

*End of Specification — Prominent v1.0*