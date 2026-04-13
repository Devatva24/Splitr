import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ── Types (unchanged — UI stays identical) ────────────────────
export interface UPIProfile {
  upiId?: string;
  qrData?: string;
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
  members: string[];
  memberProfiles: Record<string, UPIProfile>;
  expenses: Expense[];
  createdAt: number;
}

// ── Guest localStorage key ────────────────────────────────────
const GUEST_KEY = "splitr_data_v5_guest";

// ── DB row → App type helpers ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExpense(row: any): Expense {
  return {
    id:         row.id,
    desc:       row.description,
    amount:     Number(row.amount),
    payer:      row.payer,
    splitAmong: row.split_among ?? [],
    settled:    row.settled,
    date:       row.date,
    category:   row.category,
    createdAt:  new Date(row.created_at).getTime(),
    editedAt:   row.edited_at ? new Date(row.edited_at).getTime() : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGroup(row: any): Group {
  return {
    id:             row.id,
    name:           row.name,
    emoji:          row.emoji,
    members:        row.members ?? [],
    memberProfiles: row.member_profiles ?? {},
    expenses:       (row.expenses ?? [])
                      .map(rowToExpense)
                      .sort((a: Expense, b: Expense) => b.createdAt - a.createdAt),
    createdAt:      new Date(row.created_at).getTime(),
  };
}

// ── Guest data → Supabase migration ──────────────────────────
async function migrateGuestToSupabase(userId: string, guestGroups: Group[]) {
  for (const group of guestGroups) {
    const newGroupId = crypto.randomUUID();

    const { error: groupErr } = await supabase.from("groups").insert({
      id:             newGroupId,
      user_id:        userId,
      name:           group.name,
      emoji:          group.emoji,
      members:        group.members,
      member_profiles: group.memberProfiles,
    });

    if (groupErr) {
      console.error("Migration: failed to insert group", groupErr.message);
      continue;
    }

    for (const expense of group.expenses) {
      await supabase.from("expenses").insert({
        id:          crypto.randomUUID(),
        group_id:    newGroupId,
        description: expense.desc,
        amount:      expense.amount,
        payer:       expense.payer,
        split_among: expense.splitAmong,
        settled:     expense.settled,
        date:        expense.date,
        category:    expense.category,
        created_at:  new Date(expense.createdAt).toISOString(),
      });
    }
  }
}

function uid() {
  // Use crypto.randomUUID for auth users (valid UUID for Supabase)
  // Use simple random for guests (doesn't go to DB)
  try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2, 10); }
}

// ── Hook ──────────────────────────────────────────────────────
export function useExpenseStore(userId: string) {
  const isGuest = !userId;
  const [groups, setGroups] = useState<Group[]>([]);
  const prevUserIdRef = useRef<string>(userId);

  // ── Load data ─────────────────────────────────────────────
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (isGuest) {
      // Guest: read from localStorage
      try {
        const raw = JSON.parse(localStorage.getItem(GUEST_KEY) || '{"groups":[]}');
        setGroups((raw.groups ?? []).map((g: Group) => ({ memberProfiles: {}, ...g })));
      } catch {
        setGroups([]);
      }
      return;
    }

    // Authenticated: optionally migrate guest data, then load from Supabase
    const loadAuthenticated = async () => {
      // If user just signed in/up and there's guest data — migrate it
      if (!prevUserId) {
        const guestRaw = localStorage.getItem(GUEST_KEY);
        if (guestRaw) {
          try {
            const guestState = JSON.parse(guestRaw);
            const guestGroups: Group[] = (guestState.groups ?? []).map((g: Group) => ({
              memberProfiles: {},
              ...g,
            }));
            if (guestGroups.length > 0) {
              await migrateGuestToSupabase(userId, guestGroups);
            }
          } catch (e) {
            console.error("Guest migration failed:", e);
          }
          localStorage.removeItem(GUEST_KEY);
        }
      }

      // Load from Supabase
      const { data, error } = await supabase
        .from("groups")
        .select("*, expenses(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) { console.error("Failed to load groups:", error.message); return; }
      setGroups((data ?? []).map(rowToGroup));
    };

    loadAuthenticated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Auto-save guest groups to localStorage ────────────────
  useEffect(() => {
    if (isGuest) {
      localStorage.setItem(GUEST_KEY, JSON.stringify({ groups }));
    }
  }, [isGuest, groups]);

  // ── Groups ────────────────────────────────────────────────
  const addGroup = useCallback(
    (name: string, members: string[], emoji: string) => {
      const id = uid();
      const g: Group = {
        id, name, emoji, members, memberProfiles: {}, expenses: [], createdAt: Date.now(),
      };
      setGroups((prev) => [g, ...prev]);

      if (!isGuest) {
        supabase
          .from("groups")
          .insert({ id, user_id: userId, name, emoji, members, member_profiles: {} })
          .then(({ error }) => {
            if (error) {
              console.error("addGroup failed:", error.message);
              setGroups((prev) => prev.filter((g2) => g2.id !== id));
            }
          });
      }
      return g;
    },
    [isGuest, userId]
  );

  const editGroup = useCallback(
    (groupId: string, name: string, emoji: string) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, name, emoji } : g))
      );
      if (!isGuest) {
        supabase.from("groups").update({ name, emoji }).eq("id", groupId)
          .then(({ error }) => { if (error) console.error("editGroup:", error.message); });
      }
    },
    [isGuest]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (!isGuest) {
        supabase.from("groups").delete().eq("id", groupId)
          .then(({ error }) => { if (error) console.error("deleteGroup:", error.message); });
      }
    },
    [isGuest]
  );

  const getGroup = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups]
  );

  // ── Member UPI profiles ───────────────────────────────────
  const setMemberUPI = useCallback(
    (groupId: string, memberName: string, profile: UPIProfile) => {
      setGroups((prev) => {
        const updated = prev.map((g) =>
          g.id === groupId
            ? { ...g, memberProfiles: { ...g.memberProfiles, [memberName]: profile } }
            : g
        );
        if (!isGuest) {
          const group = updated.find((g) => g.id === groupId);
          if (group) {
            supabase.from("groups").update({ member_profiles: group.memberProfiles }).eq("id", groupId)
              .then(({ error }) => { if (error) console.error("setMemberUPI:", error.message); });
          }
        }
        return updated;
      });
    },
    [isGuest]
  );

  // ── Expenses ──────────────────────────────────────────────
  const addExpense = useCallback(
    (groupId: string, desc: string, amount: number, payer: string, splitAmong: string[], category: string) => {
      const id   = uid();
      const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const expense: Expense = {
        id, desc, amount, payer, splitAmong, settled: false, date, category, createdAt: Date.now(),
      };
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, expenses: [expense, ...g.expenses] } : g
        )
      );
      if (!isGuest) {
        supabase.from("expenses").insert({
          id, group_id: groupId, description: desc, amount, payer,
          split_among: splitAmong, settled: false, date, category,
        }).then(({ error }) => {
          if (error) {
            console.error("addExpense:", error.message);
            setGroups((prev) =>
              prev.map((g) =>
                g.id === groupId
                  ? { ...g, expenses: g.expenses.filter((e) => e.id !== id) }
                  : g
              )
            );
          }
        });
      }
    },
    [isGuest]
  );

  const editExpense = useCallback(
    (groupId: string, expenseId: string,
     updates: Partial<Pick<Expense, "desc" | "amount" | "payer" | "splitAmong" | "category">>) => {
      const now = Date.now();
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, expenses: g.expenses.map((e) => e.id === expenseId ? { ...e, ...updates, editedAt: now } : e) }
            : g
        )
      );
      if (!isGuest) {
        const db: Record<string, unknown> = { edited_at: new Date(now).toISOString() };
        if (updates.desc       !== undefined) db.description = updates.desc;
        if (updates.amount     !== undefined) db.amount      = updates.amount;
        if (updates.payer      !== undefined) db.payer       = updates.payer;
        if (updates.splitAmong !== undefined) db.split_among = updates.splitAmong;
        if (updates.category   !== undefined) db.category    = updates.category;
        supabase.from("expenses").update(db).eq("id", expenseId)
          .then(({ error }) => { if (error) console.error("editExpense:", error.message); });
      }
    },
    [isGuest]
  );

  const toggleSettle = useCallback(
    (groupId: string, expenseId: string) => {
      let newSettled = false;
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            expenses: g.expenses.map((e) => {
              if (e.id !== expenseId) return e;
              newSettled = !e.settled;
              return { ...e, settled: newSettled };
            }),
          };
        })
      );
      if (!isGuest) {
        supabase.from("expenses").update({ settled: newSettled }).eq("id", expenseId)
          .then(({ error }) => { if (error) console.error("toggleSettle:", error.message); });
      }
    },
    [isGuest]
  );

  const deleteExpense = useCallback(
    (groupId: string, expenseId: string) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }
            : g
        )
      );
      if (!isGuest) {
        supabase.from("expenses").delete().eq("id", expenseId)
          .then(({ error }) => { if (error) console.error("deleteExpense:", error.message); });
      }
    },
    [isGuest]
  );

  return {
    groups, isGuest,
    addGroup, editGroup, deleteGroup, getGroup,
    addExpense, editExpense, toggleSettle, deleteExpense,
    setMemberUPI,
  };
}

// ── Pure compute helpers (unchanged) ─────────────────────────
export function computeBalances(group: Group): Record<string, number> {
  const bal: Record<string, number> = {};
  group.members.forEach((m) => (bal[m] = 0));
  group.expenses.filter((e) => !e.settled).forEach((e) => {
    const share = e.amount / e.splitAmong.length;
    e.splitAmong.forEach((m) => (bal[m] = (bal[m] || 0) - share));
    bal[e.payer] = (bal[e.payer] || 0) + e.amount;
  });
  return bal;
}

export function computeSettlements(group: Group) {
  const bal = computeBalances(group);
  const d = Object.entries(bal).filter(([, v]) => v < -0.005).map(([m, v]) => ({ m, v })).sort((a, b) => a.v - b.v);
  const c = Object.entries(bal).filter(([, v]) => v > 0.005).map(([m, v]) => ({ m, v })).sort((a, b) => b.v - a.v);
  const txns: { from: string; to: string; amt: number }[] = [];
  const dd = d.map((x) => ({ ...x })), cc = c.map((x) => ({ ...x }));
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
  return name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export const CATEGORY_LABELS: Record<string, string> = {
  general: "General", food: "Food & Drink", transport: "Transport",
  accommodation: "Stay", entertainment: "Entertainment", shopping: "Shopping", utilities: "Utilities",
};

export function buildUPILink(upiId: string, amount: number, payeeName: string, note = "Splitr settlement"): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
}
