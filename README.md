# Splitr

A sophisticated, dark-themed expense splitting app built with React, TypeScript, and Vite. Track shared expenses across groups, calculate balances automatically, settle debts with minimal payments, and pay directly via UPI — all from the browser, no backend required.

---

## Features

### Authentication
- **Account creation & login** — email and password based, with client-side hashing
- **Private data** — each user's groups and expenses are stored separately under their account ID; no data leaks between accounts
- **Persistent sessions** — stay logged in across browser sessions via `localStorage`
- **Password strength indicator** on registration

### Groups
- Create named groups with a custom emoji icon and any number of members
- **Edit** group name and emoji inline at any time
- Delete a group along with all its expenses
- Member avatars with stacked initials shown on the groups list

### Expenses
- Add expenses with description, amount, payer, split members, and category
- Categories: General, Food & Drink, Transport, Stay, Entertainment, Shopping, Utilities
- **Edit any expense** inline — update description, amount, payer, or who it's split among; edits are timestamped
- Mark individual expenses as settled or unsettled
- Delete expenses with a confirmation prompt
- Per-person split amount shown automatically

### Balances & Settle Up
- Real-time balance calculation per member across all unsettled expenses
- **Minimum payments algorithm** — computes the fewest transactions needed to fully settle a group
- Visual balance bars showing relative magnitude of each person's position

### UPI & Payments
- Save a UPI ID and phone number for each group member under the **Pay / UPI** tab
- **One-tap UPI payment** — generates a `upi://pay` deep-link pre-filled with the correct amount; opens any UPI app (GPay, PhonePe, Paytm, etc.) directly
- **WhatsApp reminder** — generates a pre-written reminder message with the pending amount; opens WhatsApp Web or the app
- Show the payee's UPI ID inline for manual payments
- Pending amount auto-calculated per member from unsettled expenses

### History
- Chronological list of all expenses across every group
- Filter by group with one click
- Shows total amount and transaction count for the current filter

### Analytics
- Key metrics: total tracked, settled amount, average expense, settlement percentage
- Spending breakdown by group with relative bar charts
- Spending breakdown by category
- Top payers ranked by total amount paid

### Design
- Monochromatic dark theme — pure blacks, whites, and grays only; no color noise
- **DM Serif Display** for editorial headings, **Instrument Sans** for body text, **JetBrains Mono** for all numbers
- Hairline `1px` borders define structure; no decorative shadows or gradients
- Fully responsive — top navbar on desktop, bottom tab bar on mobile
- Smooth fade-in transitions on page and list loads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 5 (SWC) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| UI primitives | Radix UI (via shadcn/ui) |
| State management | React Context + `useState` |
| Data persistence | `localStorage` (per-user namespaced) |
| Testing | Vitest + Testing Library |

---

## Project Structure

```
src/
├── App.tsx                        # Root — providers, routing, auth gates
│
├── contexts/
│   ├── AuthContext.tsx            # Auth state shared across the app
│   └── StoreContext.tsx           # Global expense store (single reactive instance)
│
├── hooks/
│   ├── useAuthStore.ts            # register / login / logout logic + localStorage
│   └── useExpenseStore.ts         # Groups, expenses, balances, UPI — all core logic
│
├── pages/
│   ├── Index.tsx                  # Groups list + group detail view
│   ├── History.tsx                # Cross-group expense history with filters
│   ├── Analytics.tsx              # Spending analytics and charts
│   ├── Login.tsx                  # Sign-in page
│   ├── Register.tsx               # Account creation page
│   └── NotFound.tsx               # 404
│
├── components/
│   ├── Navbar.tsx                 # Top nav + mobile bottom bar + user menu
│   ├── GroupDetail.tsx            # Expenses / Balances / Settle Up / UPI tabs
│   ├── AddExpenseDialog.tsx       # Modal — add a new expense
│   ├── NewGroupDialog.tsx         # Modal — create a new group
│   ├── ConfirmDialog.tsx          # Generic confirmation dialog
│   ├── ProtectedRoute.tsx         # Redirects unauthenticated users to /login
│   ├── NavLink.tsx                # React Router NavLink wrapper
│   └── ui/                        # shadcn/ui primitives (Dialog, AlertDialog, etc.)
│
├── lib/
│   └── utils.ts                   # Tailwind merge helper
│
├── index.css                      # CSS variables (dark theme) + font imports
└── main.tsx                       # React DOM entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The app runs at `http://localhost:8080` by default.

### Other commands

```bash
npm run build        # Production build → dist/
npm run preview      # Preview the production build locally
npm run lint         # ESLint
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

---

## Data Storage

All data is stored in the browser's `localStorage` — there is no server, no database, and no network requests (except for loading Google Fonts).

| Key | Contents |
|---|---|
| `splitr_auth_v1` | All user accounts (hashed passwords, names, emails) |
| `splitr_data_v5_{userId}` | Groups and expenses for a specific user |

Passwords are hashed client-side with a simple integer hash before storage. This is suitable for a local-first personal app; for production deployment with sensitive data, replace with a proper backend auth service (e.g. Supabase, Firebase Auth).

---

## UPI Integration

The UPI payment flow uses the standard `upi://` deep-link URI scheme supported by all major Indian UPI apps.

**Link format:**
```
upi://pay?pa={upiId}&pn={payeeName}&am={amount}&cu=INR&tn={note}
```

When a member's UPI ID is saved, the Settle Up tab generates this link pre-filled with the exact settlement amount. Tapping it opens the default UPI app on the device.

**WhatsApp reminders** open `https://wa.me/91{phone}?text={message}` with a pre-written message containing the pending amount.

---

## Architecture Notes

### Why a global StoreContext?

The expense store (`useExpenseStore`) holds all group and expense state in React `useState`. If multiple components each call the hook independently, they each get their own isolated state instance — changes in one don't reflect in others.

`StoreContext` solves this by instantiating the store once at the `AppRoutes` level and distributing it via React Context. Every component — `Navbar`, `Index`, `History`, `Analytics`, `GroupDetail` — calls `useStore()` and reads from the same reactive instance. Add a group anywhere → the navbar counter, the groups list, history, and analytics all update simultaneously.

### Settlement algorithm

The minimum-payment algorithm runs in O(n log n):

1. Compute net balance per member (positive = owed money, negative = owes money)
2. Sort debtors ascending, creditors descending
3. Greedily match largest debtor to largest creditor, record a transaction for `min(|debtor|, creditor)`, adjust both balances
4. Repeat until all balances are within ±0.005 (floating-point tolerance)

This produces the fewest possible transactions to fully settle a group.

---

## Roadmap

- [ ] Cloud sync / multi-device support (Supabase or Firebase backend)
- [ ] Recurring expenses
- [ ] Expense photos / receipt attachments
- [ ] CSV / PDF export
- [ ] Push notifications for pending payments
- [ ] Multi-currency support
- [ ] Native mobile app (React Native)

---

## License

MIT
