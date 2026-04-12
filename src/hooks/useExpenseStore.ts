import { useState, useCallback } from "react";

export interface UPIProfile {
  upiId?: string;
  qrData?: string; // raw UPI deep-link string
  phone?: string;
}

export interface Member {
  name: string;
  upi?: UPIProfile;
}

export interface Expense {
  id: string;
  desc: string;
  amount: number;
  payer: string;
  splitAmong: string[];
  settled: boolean;
  date: string;
  category: string;
  createdAt: number;
  editedAt?: number;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: string[];           // names array (kept simple)
  memberProfiles: Record<string, UPIProfile>; // name -> profile
  expenses: Expense[];
  createdAt: number;
}

interface State { groups: Group[]; }

const BASE_KEY = "splitr_data_v5";
const storageKey = (uid: string) => `${BASE_KEY}_${uid}`;

function loadState(userId: string): State {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(userId)) || '{"groups":[]}');
    // Migrate old data that lacks memberProfiles
    raw.groups = (raw.groups || []).map((g: Group) => ({
      memberProfiles: {},
      ...g,
    }));
    return raw;
  } catch { return { groups: [] }; }
}

function uid() { return Math.random().toString(36).slice(2, 10); }

export function useExpenseStore(userId: string) {
  const [state, setState] = useState<State>(() => loadState(userId));

  const save = useCallback((newState: State) => {
    setState(newState);
    localStorage.setItem(storageKey(userId), JSON.stringify(newState));
  }, [userId]);

  /* ── Groups ── */
  const addGroup = useCallback((name: string, members: string[], emoji: string) => {
    const g: Group = { id: uid(), name, emoji, members, memberProfiles: {}, expenses: [], createdAt: Date.now() };
    save({ groups: [g, ...state.groups] });
    return g;
  }, [state, save]);

  const editGroup = useCallback((groupId: string, name: string, emoji: string) => {
    save({ groups: state.groups.map(g => g.id === groupId ? { ...g, name, emoji } : g) });
  }, [state, save]);

  const deleteGroup = useCallback((id: string) => {
    save({ groups: state.groups.filter(g => g.id !== id) });
  }, [state, save]);

  const getGroup = useCallback((id: string) => state.groups.find(g => g.id === id), [state]);

  /* ── Member UPI profiles ── */
  const setMemberUPI = useCallback((groupId: string, memberName: string, profile: UPIProfile) => {
    save({
      groups: state.groups.map(g =>
        g.id === groupId
          ? { ...g, memberProfiles: { ...g.memberProfiles, [memberName]: profile } }
          : g
      ),
    });
  }, [state, save]);

  /* ── Expenses ── */
  const addExpense = useCallback((groupId: string, desc: string, amount: number, payer: string, splitAmong: string[], category: string) => {
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const expense: Expense = { id: uid(), desc, amount, payer, splitAmong, settled: false, date, category, createdAt: Date.now() };
    save({ groups: state.groups.map(g => g.id === groupId ? { ...g, expenses: [expense, ...g.expenses] } : g) });
  }, [state, save]);

  const editExpense = useCallback((groupId: string, expenseId: string, updates: Partial<Pick<Expense, "desc" | "amount" | "payer" | "splitAmong" | "category">>) => {
    save({
      groups: state.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              expenses: g.expenses.map(e =>
                e.id === expenseId ? { ...e, ...updates, editedAt: Date.now() } : e
              ),
            }
          : g
      ),
    });
  }, [state, save]);

  const toggleSettle = useCallback((groupId: string, expenseId: string) => {
    save({ groups: state.groups.map(g => g.id === groupId ? { ...g, expenses: g.expenses.map(e => e.id === expenseId ? { ...e, settled: !e.settled } : e) } : g) });
  }, [state, save]);

  const deleteExpense = useCallback((groupId: string, expenseId: string) => {
    save({ groups: state.groups.map(g => g.id === groupId ? { ...g, expenses: g.expenses.filter(e => e.id !== expenseId) } : g) });
  }, [state, save]);

  return {
    groups: state.groups,
    addGroup, editGroup, deleteGroup, getGroup,
    addExpense, editExpense, toggleSettle, deleteExpense,
    setMemberUPI,
  };
}

/* ── Compute helpers ── */
export function computeBalances(group: Group): Record<string, number> {
  const bal: Record<string, number> = {};
  group.members.forEach(m => (bal[m] = 0));
  group.expenses.filter(e => !e.settled).forEach(e => {
    const share = e.amount / e.splitAmong.length;
    e.splitAmong.forEach(m => (bal[m] = (bal[m] || 0) - share));
    bal[e.payer] = (bal[e.payer] || 0) + e.amount;
  });
  return bal;
}

export function computeSettlements(group: Group) {
  const bal = computeBalances(group);
  const d = Object.entries(bal).filter(([, v]) => v < -0.005).map(([m, v]) => ({ m, v })).sort((a, b) => a.v - b.v);
  const c = Object.entries(bal).filter(([, v]) => v > 0.005).map(([m, v]) => ({ m, v })).sort((a, b) => b.v - a.v);
  const txns: { from: string; to: string; amt: number }[] = [];
  const dd = d.map(x => ({ ...x })), cc = c.map(x => ({ ...x }));
  let di = 0, ci = 0;
  while (di < dd.length && ci < cc.length) {
    const amt = Math.min(-dd[di].v, cc[ci].v);
    txns.push({ from: dd[di].m, to: cc[ci].m, amt });
    dd[di].v += amt; cc[ci].v -= amt;
    if (Math.abs(dd[di].v) < 0.005) di++;
    if (Math.abs(cc[ci].v) < 0.005) ci++;
  }
  return txns;
}

export function fmt(n: number) {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export const CATEGORY_LABELS: Record<string, string> = {
  general: "General", food: "Food & Drink", transport: "Transport",
  accommodation: "Stay", entertainment: "Entertainment", shopping: "Shopping", utilities: "Utilities",
};

export function buildUPILink(upiId: string, amount: number, payeeName: string, note = "Splitr settlement"): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
}
