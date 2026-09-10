# Build Brief: TTM CRM
### Paste this whole document into your AI coding tool (Lovable, Bolt, v0, Cursor, Replit Agent, etc.) as the first message.

---

## 0. How I want you to work

Before you write any code:

1. **Ask me clarifying questions first.** Don't assume — ask about anything in this brief that's ambiguous (branch count, currency, language, logo/brand colors if I have them, whether I have real customer/product data to seed with, etc.).
2. **Propose a short design plan before building.** Give me a palette (named hex values), type choices, and a layout concept for the dashboard and the customer record view. Wait for my go-ahead before generating screens.
3. **Build in stages, not all at once.** Suggested order: (1) layout shell + navigation, (2) customer list + customer detail/record view, (3) call logging, (4) pipeline/stage view, (5) reports, (6) product store, (7) import/export, (8) settings/users. After each stage, stop and show me the result.
4. **After every stage, explicitly ask me:** "What would you like me to change here, and is there anything you want added that isn't in the brief?" Don't wait for me to spot problems — proactively point out rough edges, inconsistent spacing, or weak states (empty/error/loading) you notice yourself and offer to fix them.
5. **Treat this brief as a floor, not a ceiling.** If you see a feature, safeguard, or UX detail that would obviously help a real sales team using this daily (e.g., confirmation before deleting a customer, keyboard shortcuts for fast call logging, unsaved-changes warnings), suggest it even though I didn't ask.
6. **Keep a running list of decisions and open questions** at the top of your responses as we go, so I can see what's confirmed vs. still undecided.

---

## 1. What this project is

TTM CRM is a customer relationship management tool for a sales team that spends most of its day on the phone. Agents log every call, tag where the customer came from, and track them from first contact through to becoming a paying client. Managers need daily/weekly/monthly visibility into sales, sources, and branch performance.

This is **not** a generic SaaS dashboard demo. It's a working tool for people who will use it 40+ times a day between calls — it needs to be fast to enter data into, easy to scan, and trustworthy-looking, not flashy.

---

## 2. Design direction — read this carefully

**I do not want this to look AI-generated.** Specifically, avoid all of the following, which are the default tells of AI-built interfaces right now:

- ❌ Warm cream background with a high-contrast serif headline and a terracotta/clay accent color.
- ❌ Near-black background with one neon accent (acid green, electric violet, vermillion).
- ❌ The "SaaS card kit" look: everything chopped into identical rounded-corner cards, all with the same soft grey drop shadow, gradient washes used as decoration.
- ❌ Tracked-out ALL-CAPS eyebrow labels above every section heading.
- ❌ Numbered badges (01 / 02 / 03) on things that aren't actually a sequence.
- ❌ Middle-dot separated meta text ("Agent · Branch · Today"), em-dash labels ("REPORTS — Overview"), arrows tacked onto every button ("View report →").
- ❌ A generic blue-and-purple gradient "AI startup" color scheme.
- ❌ Bouncy fade-and-slide-up animation on every card as it loads, or a hover-lift effect on every single card.

**Instead:**

- Design this the way you'd design **call-center or field-operations software** — think of the visual world of phone logs, ledgers, dispatch boards, and daily report sheets, not a crypto landing page. Ground the palette and type in that world.
- Pick **one deliberate accent color** and a neutral base — not a default blue. Consider colors associated with trust and clarity in operational tools (deep teal, ink navy, forest, slate) paired with a single warm working accent (amber, rust, ochre) used *only* for actionable/urgent items (e.g., overdue follow-ups), not decoration.
- Use **one typeface family** (two max, clearly distinct roles — e.g., one for data-dense tables, one for headings) and set a real type scale. Numbers (phone numbers, prices, call counts) should be legible and evenly spaced — consider a face with proper tabular figures for tables and reports.
- Density over whitespace-for-its-own-sake: agents will be scanning long lists of customers and calls all day. Favor compact, well-aligned tables and lists over big airy hero sections. This is a workhorse app, not a marketing site.
- Motion should be functional, not decorative: a row expanding, a saved-confirmation, a stage moving on the pipeline board. No orchestrated entrance animations on every page load.
- The "customer stage" tag (Contact/Lead/Customer/Client) is the one place you're allowed to be a little bold with color-coding — make the four stages instantly distinguishable at a glance, since staff will rely on this visually across long lists.
- Write real, specific copy — real Ethiopian phone number formats, real-sounding company names, real product names — not "Lorem Ipsum," not "Acme Corp," not "John Doe." Empty states should say something useful and specific ("No calls logged yet — log your first call" not "No data").

Before building any screen, give me your palette (named hex values), font choices, and a one-paragraph rationale for why they fit a phone-based sales team — not a generic rationale you'd give for any dashboard.

---

## 3. Tech stack

- **Frontend:** React + TypeScript, Tailwind CSS
- **Backend/Database:** Supabase (Postgres) — use it for auth, role-based access, and storage
- **Charts:** a lightweight charting library (Recharts or similar) for the reports
- **Auth:** email/password to start, role field on the user (Admin / Branch Manager / Sales Agent)

If your platform has a strong opinionated default stack instead, propose it and explain the trade-off — don't silently swap it in.

---

## 4. Data model

### Customer / Contact
| Field | Type | Notes |
|---|---|---|
| Customer ID | auto | |
| Customer Name | text | |
| Company Name | text | optional |
| Phone Number | text | primary contact |
| Alternate Phone | text | optional |
| Email | text | optional |
| Customer Type | enum: New, Old | |
| Source (if New) | enum: Social, Digital Media, Referral | if Social/Referral, capture platform/referrer name in a follow-up field |
| Source (if Old) | enum: existing source list | |
| Purpose of Call | text | |
| Customer Stage | enum: Contact, Lead, Customer, Client | shown as a color-coded tag everywhere the customer appears |
| Assigned User | reference to User | |
| Next Follow-up Date | date | optional, drives reminders |
| Lead Priority | enum: Hot, Warm, Cold | optional |
| Deal Value | currency | optional |
| Created / Updated timestamps | datetime | |

### Call Log (one customer has many)
| Field | Type | Notes |
|---|---|---|
| Call ID | auto | |
| Customer ID | reference | |
| User ID | reference | who took the call |
| Date/Time | datetime | |
| Duration (minutes) | number | |
| Purpose | text | |
| Remark | text | free-form notes |

### Product / Item
| Field | Type | Notes |
|---|---|---|
| Item ID | auto | |
| Item Name | text | |
| Item Description | text | |
| Item Category | text | |
| Item Price | currency | |
| Stock Quantity | number | optional |

### Product Sale (links Customer + Product)
| Field | Type | Notes |
|---|---|---|
| Sale ID | auto | |
| Customer ID | reference | |
| Item ID | reference | |
| Quantity | number | |
| Sale Date | date | |
| Sale Amount | currency | |

### User
| Field | Type | Notes |
|---|---|---|
| User ID | auto | |
| Name | text | |
| Role | enum: Admin, Branch Manager, Sales Agent | |
| Branch | reference | |

### Branch
| Field | Type | Notes |
|---|---|---|
| Branch ID | auto | |
| Branch Name | text | |

---

## 5. Pages & features to build

### 5.1 Dashboard (home)
- Today's calls, new leads today, conversion rate, top source this week — at a glance
- Quick-access "Log a call" button, always reachable

### 5.2 Customers
- Filterable, sortable list (by stage, source, branch, assigned agent, date range)
- Search by name, company, or phone number
- Customer detail view: full profile + full call history log (not just the latest remark) + next follow-up + stage, with ability to change stage from this screen
- "Log call" action available directly from the customer's row and from their detail view

### 5.3 Pipeline view
- Kanban-style board: Contact → Lead → Customer → Client
- Drag a customer card between stages
- Show stage-change history on the customer's record

### 5.4 Reports
- Sales report (daily / weekly / monthly, switchable)
- Source report
- Branch report
- Most-calls report (by count and total minutes)
- Product sales report
- All reports: filter by date range, branch, and agent; export to PDF/Excel
- Conversion funnel (Contact → Lead → Customer → Client, as percentages)

### 5.5 Product Store
- Table of items (name, category, description, price, stock)
- Add / edit / delete item
- Each product page shows recent sales tied to it

### 5.6 Filters
- A consistent filter panel/component reused across Customers, Sales, and Product views — build this once, not three different filter UIs

### 5.7 Import / Export
- Import customers from Excel/CSV, Google Sheets, and Google Contacts
- On import: detect and flag likely duplicates (match on phone number or email) before committing
- Show a per-row validation report after import (what succeeded, what failed and why)
- Export customers, sales, and product data to Excel/CSV

### 5.8 Users & Roles
- Admin: full access to everything, all branches
- Branch Manager: full access to their branch only
- Sales Agent: sees and edits only their assigned customers; limited reporting

### 5.9 Notifications (build if time allows, otherwise stub it and flag as Phase 2)
- Follow-up due/overdue reminders on the dashboard

---

## 6. States and edge cases to actually handle (not just the happy path)

- Empty states for: no customers yet, no calls logged yet, no search results, no data in a report's date range
- Loading states for slow report queries
- What happens when a customer has zero call history vs. a long one
- Confirming before destructive actions (deleting a customer or product)
- Form validation messages that say what's wrong and how to fix it, in plain language
- Mobile/narrow-window behavior for agents who might use this on a tablet

---

## 7. What to do at the end of every stage

Show me the screen(s) you built, then explicitly ask:
1. "What should I change on this screen?"
2. "Is there anything missing here you'd want, even if it wasn't in the brief?"
3. Point out at least one thing you think is weak or unfinished and offer options to fix it.

Don't move to the next stage until I confirm.
