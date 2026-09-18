# TTM CRM — Developer Requirements

**Feature Specification:** Branches, Customer Auto-Reassignment, Roles, Notifications, AI Monitoring, Development Process & Historical Data Migration
**Stack:** React, TypeScript, Tailwind CSS, Supabase
**Design Reference:** Frappe/ERPNext-style dark workspace

---

## 1. UI Consistency Requirement

Every page and module added to the application — Branch view, Customer detail, Reports, AI Summaries, Notifications, and any future page — must reuse the exact same visual system as the main dashboard. No new page should introduce its own styling.

**Design system to reuse everywhere:**
- Dark flat theme, sparse accent color use
- Pill badges for status indicators (leaderboard rank/tier, stock status, labels)
- Flat sidebar navigation
- Global search bar with keyboard shortcut hint
- Dashboard pattern: metric tiles + grouped quick-link rows with count badges
- Same typography, spacing, and color tokens as the reference screenshot on every screen

> Recommendation: maintain a single shared "design tokens" reference (colors, spacing, badge styles) and paste it into every new page-build prompt so the UI doesn't visually drift as features are added over time.

---

## 2. Branches

### 2.1 Branch Structure
- All branches are located in Addis Ababa. No timezone or geo-routing logic is required.
- Branches should be differentiated by name / sub-city (e.g., Bole, Piassa, Megenagna), not by geolocation detection.
- Branches are used as the primary filter dimension across the app (customers, calls, reports, dashboard).

### 2.2 Branch Assignment on First Contact
- Admin creates and manages the list of branches and assigns Branch Managers to them.
- A customer's "main branch" is auto-assigned based on whichever branch first logs that customer into the system (not by location/geo-detection, since all branches are in Addis Ababa).

### 2.3 Automatic Branch Reassignment Rule
A customer's main branch automatically changes to a new branch if the customer completes 5 consecutive purchases from that new branch.

**Logic to implement:**
1. Track a per-customer "consecutive purchase streak" counter per branch.
2. Each purchase from a branch different than the customer's current main branch increments that branch's streak counter.
3. If a purchase breaks the streak (i.e., the customer buys from their original/another branch before reaching 5), the counter resets to 0. (Reset — not pause — for simplicity and predictability.)
4. On reaching 5 consecutive purchases at the new branch, the system automatically updates the customer's main branch.
5. This rule applies from the customer's first recorded purchase onward — it is not limited to customers with a long purchase history.

**Required audit trail:**
- Every branch reassignment must be logged with: previous branch, new branch, date/time, and reason (e.g., "Reassigned: 5 consecutive purchases at Branch B, Sep 1–10").
- This log should be visible to Admin and to both the losing and gaining Branch Managers, so reassignments are transparent and not disputable.

### 2.4 Branch Change Notification
When a customer's main branch changes, the system sends an in-app web notification.

**Specification:**
- Recipient: the new Branch Manager / branch team receives a congratulatory notification.
- Optional secondary recipient: the previous branch also receives an informational notice (e.g., "Customer X moved to Branch B").
- Notification type: in-app toast/banner AND a persistent entry in a notifications inbox/bell icon, so it isn't missed if the user is offline when it fires.
- Example message: "🎉 Congratulations! [Customer Name] is now one of your branch's customers after 5 consecutive purchases."

---

## 3. Roles & Permissions

### 3.1 Role Hierarchy
Branch Managers are also Sales users — they perform sales activities themselves in addition to managing their branch. Implement this as role inheritance rather than duplicating rule sets:

- **Admin** → full system access, manages branches, users, labels/tags, and audit logs
- **Branch Manager** → inherits all Sales permissions (log calls, manage own customers) PLUS branch-wide visibility: sees all customers and reps under their branch, branch-level reporting, and branch scoreboard
- **Sales** → manages their own assigned customers, logs calls/notes, views their own performance

**Open decision for the developer to confirm with Tesfish before building:**
- Can a Branch Manager view/edit other reps' individual customer notes within their branch, or only see aggregate branch stats? This affects trust among sales staff and should be decided explicitly rather than left as a default permission.

---

## 4. Customer Detail View

Existing structure: tabbed slide-over with Overview, Call History, and Notes tabs; metric row; delete action repositioned away from primary actions. (Inline pipeline-stage editing no longer applies, since Pipeline has been replaced by the Customer Leaderboard — see Section 6.)

**Additions:**
- Add a dedicated "Product Requests" tab (separate from Overview)
- Add a dedicated "Purchase History" tab (separate from Overview), since both will need their own filtering/sorting
- Show "Last Contacted" and "Next Follow-up Due" fields prominently at the top of the slide-over
- Display the branch-reassignment audit log (from Section 2.3) within the customer's record

---

## 5. Filtering

Users can filter customer data by sales rep, branch, out-of-stock status, and all labels — across weekly, monthly, yearly, and custom date ranges.

**Additions:**
- Saved filter presets per user (e.g., "My overdue leads this week") to speed up repeated daily workflows
- Labels/tags are managed centrally by Admin (create, edit, retire) so the tag list stays clean over time

---

## 6. Dashboard & Customer Leaderboard

> **Note:** The original Pipeline stage feature (Contact → Lead → Customer → Client) has been **fully removed** from the system and replaced with a **Customer Leaderboard**. The developer should keep the current Leaderboard implementation as the system's ranking/scoreboard mechanism — **do not reintroduce Pipeline stage tracking.**

The dashboard shows a weekly, monthly, and over-time scoreboard for each client via the Customer Leaderboard.

**Needs clarification for the developer:**
- Define exactly what the Leaderboard ranks by — e.g., calls made, purchase frequency, revenue generated, or a weighted composite of these. The developer needs a concrete formula, not just the word "leaderboard."
- Consider adding a leaderboard view across users/branches to support team motivation — a common feature in call-center tools.

---

## 7. Reports, Charts & Export

Users can view daily, weekly, monthly, and custom-period communication data, and download pie charts or tables of the available data.

**Specification:**
- Export formats: PNG or PDF for charts; CSV or XLSX for tables
- Optional Phase 2 addition: scheduled email reports (e.g., auto-send a weekly summary to managers)

---

## 8. AI Integration

The web will integrate an AI API to monitor client communications and generate summaries, follow-up suggestions, and sales forecasts.

**Break this into three distinct, separately-scoped features to avoid scope creep:**
1. Call / note summarization — AI reads logged call notes and produces a short summary per customer or per period.
2. Follow-up reminders — AI scans notes/summaries and surfaces suggested follow-up actions or due dates.
3. Sales forecasting — AI estimates forecasts based on customer purchase history and leaderboard trends.

**Important flag for Tesfish:**
- Data privacy and consent: clarify whether calls are recorded/transcribed, and whether customer consent language is required before any AI processing of communication data.
- Recommended build order: start with summarization only (Feature 1) to validate the AI integration and data quality, then layer in follow-up reminders and forecasting once historical data is clean and sufficient.

---

## 9. Error Handling

- User-facing error messages: consistent toast/banner style matching the dark theme
- Retry logic for Supabase calls (network drops, timeouts)
- Logging: Admin should be able to view failed imports/exports and system errors, not just see a generic error shown to the end user

---

## 10. Additional Recommendations

- Role-based permissions matrix: explicitly define who can delete customers, edit branch assignment, export data, and view AI summaries
- Duplicate customer detection on import/manual entry
- Notification system (in-app and/or email) for follow-up due dates and leaderboard rank changes
- Mobile/tablet responsiveness: confirm with Tesfish whether this is required for v1 or desktop-only
- Data backup/retention policy: define call-log and notes retention period and backup routine in Supabase
- Onboarding flow for new Sales reps (first-login checklist or short tooltip tour)
- Conflict handling: define a simple rule (e.g., "last save wins") for when two reps edit the same customer record simultaneously

---

## 11. Development Process — Phase-by-Phase Delivery

The developer must build and deliver the remaining work in phases rather than all at once. Each phase must be presented to Tesfish for review and explicit confirmation before the developer begins the next phase.

**Requirements:**
- Developer proposes a phase breakdown (e.g., by feature area or by section of this document) before starting build work.
- At the end of each phase, the developer demonstrates the completed work and waits for sign-off.
- No phase should begin until the prior phase has been confirmed — this prevents rework and keeps scope changes contained to one phase at a time.

---

## 12. Historical Data Migration (Google Sheets Import)

**Background:** the company currently runs on 3-4+ years of manual Google Sheets records. Sales managers struggle to manage this data as it grows — the sheets lag, and even adding a new call record becomes difficult. Each day's communications are logged in a sheet (new tab or copy of the previous day) with: Communication ID, Customer Name, Company Name ("Private" if none), Phone Number, Call Duration, Reason for Call, Customer Status (New/Old), and Call Status (Sales, Evaluation, etc.). Weekly, this data is manually filtered by communication status into separate sheets, then summarized into frequency tables and pie charts (e.g., evaluations broken down by price-check vs. availability-check) and reviewed via screenshots in the weekly meeting.

**Timing:**
- Build this feature last, after all other core CRM features are complete and stable — not part of the initial go-live build.

**Format & mapping:**
- The historical Google Sheets format is consistent across all years/sheets, so this can be a straightforward structured import (CSV/Sheets export) rather than a flexible custom-mapping tool.
- Every historical record has a Reason for Call value. Where it is blank, the AI (per Section 8) fills it in automatically based on the rest of the communication record, rather than leaving it empty or requiring manual entry.

**Deduplication & merging:**
- The system merges historical records into single customer records (not duplicate entries) during import.
- Because the original data was entered manually, expect inconsistencies — spelling/grammar variations, or the same company written differently across records (e.g., "ABC Trading" vs. "A.B.C Trading Plc").
- Where the system detects likely duplicates that aren't an exact match, it should flag them for Admin review rather than auto-merging or auto-rejecting — Admin confirms whether to merge, keep separate, or edit before finalizing.

**Branch assignment for historical customers:**
- Imported customers are set to "Unassigned" branch by default.
- Once a call is made to/from that customer after import, the system automatically assigns their main branch per the existing branch-assignment logic (Section 2.2) — no manual backfill required.

**Tool type:**
- Build this as a reusable Import feature (available to Admin going forward for bulk uploads), not a one-time throwaway migration script — since the company may need to import additional batches later.

---

## 13. Communication Log — Data Fields & Main Feed

### 13.1 Required Fields on Every Communication Record
- **Salesperson** — auto-set to whichever user is logged in when the record is created; never manually typed or selectable, so attribution is always accurate for the Leaderboard (Section 6) and role-based filtering (Section 3).
- **Purpose of Call** — required at the point of logging a communication, not optional (this is the "Reason for Call" field from earlier sections).
- **Lead Source** — captured only when Customer Type = New (e.g., Facebook Ad, TikTok Influencer, Website Chat, In-Store Visit, Walk-in). This is the field that answers the "new customer source" tracking from the original weekly meeting requirement (Section 12 background).
- **Call Status** — the locked 7-value taxonomy: Sales, Evaluation, Service, Out of List, Out of Stock, Pre-order, Complaint. "Preorder Confirmed" from legacy sheets is the same status as "Pre-order" — standardize to one label, do not build both.
- **Remark** — a short free-text field on the communication record itself, distinct from the Customer Detail Notes tab.

### 13.2 Unified Communication Feature (Replaces Per-Category Sheets)
In the legacy system, each Call Status category had its own separate sheet (an Evaluation sheet, a Service sheet, etc.), built by manually copying filtered rows each week. In the new system, this is replaced entirely by a single unified Communications feature: all categories live together in one list/table, and category-specific views are produced by filtering rather than by physical separation. Filters must include: Call Status (all 7 categories), branch, sales rep, customer type, lead source, and date range.

### 13.3 Main Communication Feed (Live Dashboard)
The dashboard must show all logged communications, company-wide, as a single live feed — not scoped to just one salesperson's own entries.

- Every time any sales rep logs a communication, it appears at the top of this feed immediately (newest first), updating live without requiring a manual page refresh.
- Each feed entry shows: Salesperson, Customer Name, Company Name, Phone, Purpose of Call, Call Duration, Customer Type, Lead Source (if New), Call Status, and Remark.
- Alongside the feed, show the auto-calculated daily rollup: a count per Call Status category and a count per Customer Type (New vs. Old) — this replaces the manual daily tally from the legacy sheet and should recalculate automatically as new entries arrive.

---

*End of specification.*
