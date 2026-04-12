import { useState } from "react";
import { ArrowLeft, Trash2, Pencil, X, QrCode, ExternalLink } from "lucide-react";
import {
  type Group, type UPIProfile, fmt, computeBalances, computeSettlements,
  initials, CATEGORY_LABELS, buildUPILink,
} from "@/hooks/useExpenseStore";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  group: Group;
  onBack: () => void;
  onDeleteGroup: () => void;
  onEditGroup: (name: string, emoji: string) => void;
  onAddExpense: (desc: string, amount: number, payer: string, splitAmong: string[], category: string) => void;
  onEditExpense: (id: string, updates: Partial<{ desc: string; amount: number; payer: string; splitAmong: string[]; category: string }>) => void;
  onToggleSettle: (expenseId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onSetMemberUPI: (member: string, profile: UPIProfile) => void;
}

type Tab = "expenses" | "balances" | "settle" | "upi";

const EMOJIS = ["✈️","🏠","🍕","🏖️","🎒","🎊","🏔️","🚗","🎸","💼","🎯","🍜"];

export function GroupDetail({ group, onBack, onDeleteGroup, onEditGroup, onAddExpense, onEditExpense, onToggleSettle, onDeleteExpense, onSetMemberUPI }: Props) {
  const [tab, setTab] = useState<Tab>("expenses");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "group" | "expense"; id?: string } | null>(null);

  // Group editing
  const [editingGroup, setEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState(group.name);
  const [editGroupEmoji, setEditGroupEmoji] = useState(group.emoji);

  // Expense editing
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // UPI panel
  const [upiMember, setUpiMember] = useState<string | null>(null);
  const [upiInput, setUpiInput] = useState("");
  const [upiPhone, setUpiPhone] = useState("");
  const [qrExpanded, setQrExpanded] = useState<string | null>(null);

  const balances = computeBalances(group);
  const settlements = computeSettlements(group);
  const totalAll = group.expenses.reduce((s, e) => s + e.amount, 0);
  const totalUnsettled = group.expenses.filter(e => !e.settled).reduce((s, e) => s + e.amount, 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: "expenses", label: "Expenses" },
    { key: "balances", label: "Balances" },
    { key: "settle", label: "Settle up" },
    { key: "upi", label: "Pay / UPI" },
  ];

  const saveGroupEdit = () => {
    if (editGroupName.trim()) {
      onEditGroup(editGroupName.trim(), editGroupEmoji);
      setEditingGroup(false);
    }
  };

  const openUpiPanel = (member: string) => {
    const existing = group.memberProfiles?.[member];
    setUpiInput(existing?.upiId || "");
    setUpiPhone(existing?.phone || "");
    setUpiMember(member);
  };

  const saveUpi = () => {
    if (!upiMember) return;
    onSetMemberUPI(upiMember, { upiId: upiInput.trim(), phone: upiPhone.trim() });
    setUpiMember(null);
  };

  const pendingUnsettledAmount = (member: string) => {
    return group.expenses
      .filter(e => !e.settled && e.splitAmong.includes(member) && e.payer !== member)
      .reduce((s, e) => s + e.amount / e.splitAmong.length, 0);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 pt-5">
        <button onClick={onBack} className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <span className="text-border">·</span>

        {editingGroup ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="flex gap-1">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEditGroupEmoji(e)}
                  className={`w-7 h-7 rounded text-sm border transition-all ${editGroupEmoji === e ? "bg-foreground text-background border-foreground" : "bg-secondary border-border"}`}>
                  {e}
                </button>
              ))}
            </div>
            <input
              className="flex-1 min-w-0 h-8 px-2.5 bg-secondary border border-border-md rounded text-sm text-foreground focus:outline-none"
              value={editGroupName}
              onChange={e => setEditGroupName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveGroupEdit()}
              autoFocus
            />
            <button onClick={saveGroupEdit} className="text-[11px] uppercase tracking-widest text-foreground border border-border rounded px-2.5 py-1 hover:bg-secondary transition-colors">Save</button>
            <button onClick={() => setEditingGroup(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            <h1 className="text-[13px] font-medium text-foreground flex-1 truncate">{group.emoji} {group.name}</h1>
            <button onClick={() => { setEditGroupName(group.name); setEditGroupEmoji(group.emoji); setEditingGroup(true); }} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={() => setConfirmDelete({ type: "group" })} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-1">
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-px bg-border mb-6 rounded overflow-hidden border border-border">
        {[
          { label: "Total", value: fmt(totalAll) },
          { label: "Unsettled", value: fmt(totalUnsettled) },
          { label: "Expenses", value: String(group.expenses.length) },
        ].map(s => (
          <div key={s.label} className="bg-card px-4 py-3">
            <p className="label-xs mb-1.5">{s.label}</p>
            <p className="num text-[15px] font-semibold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Members ── */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {group.members.map(m => (
          <div key={m} className="flex items-center gap-1.5 h-7 px-2.5 bg-secondary border border-border rounded">
            <div className="w-4 h-4 rounded-full bg-accent border border-border flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
              {initials(m)[0]}
            </div>
            <span className="text-[12px] text-muted-foreground">{m}</span>
            {group.memberProfiles?.[m]?.upiId && (
              <span className="text-[9px] text-muted-foreground/50 ml-0.5">· UPI</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-[11px] uppercase tracking-widest pb-0.5 transition-colors border-b ${tab === t.key ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "expenses" && (
          <button onClick={() => setShowAdd(true)} className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            + Add
          </button>
        )}
      </div>

      {/* ════ EXPENSES ════ */}
      {tab === "expenses" && (
        <div>
          {!group.expenses.length ? (
            <div className="border border-border rounded px-5 py-10 text-center">
              <p className="heading-serif text-xl text-foreground/20 mb-2">No expenses yet</p>
              <button onClick={() => setShowAdd(true)} className="text-[11px] uppercase tracking-widest text-foreground underline underline-offset-4 hover:opacity-60 transition-opacity mt-1">
                Add first expense
              </button>
            </div>
          ) : (
            <div className="border border-border rounded overflow-hidden">
              {group.expenses.map((e, i) => {
                const isEditing = editingExpenseId === e.id;
                return (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    members={group.members}
                    isEditing={isEditing}
                    isLast={i === group.expenses.length - 1}
                    onStartEdit={() => setEditingExpenseId(e.id)}
                    onCancelEdit={() => setEditingExpenseId(null)}
                    onSaveEdit={updates => { onEditExpense(e.id, updates); setEditingExpenseId(null); }}
                    onToggleSettle={() => onToggleSettle(e.id)}
                    onDelete={() => setConfirmDelete({ type: "expense", id: e.id })}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════ BALANCES ════ */}
      {tab === "balances" && (
        <div>
          {Object.values(balances).every(v => Math.abs(v) < 0.01) ? (
            <div className="border border-border rounded px-5 py-10 text-center">
              <p className="heading-serif text-xl text-foreground/30">All settled up</p>
            </div>
          ) : (
            <div className="border border-border rounded overflow-hidden">
              {Object.entries(balances).map(([m, v], i, arr) => (
                <div key={m} className={`flex items-center gap-4 px-5 py-3.5 row-hover ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                    {initials(m)}
                  </div>
                  <span className="text-[13px] text-foreground flex-1">{m}</span>
                  <div className="flex-1 max-w-[100px] h-px bg-border overflow-hidden">
                    <div className="h-full bg-foreground/30 transition-all" style={{ width: `${Math.min(Math.abs(v) / Math.max(...Object.values(balances).map(Math.abs), 1) * 100, 100)}%` }} />
                  </div>
                  {Math.abs(v) < 0.01
                    ? <span className="text-[11px] text-muted-foreground/40">even</span>
                    : v > 0
                    ? <span className="num text-[12px] text-foreground">+{fmt(v)}</span>
                    : <span className="num text-[12px] text-muted-foreground">−{fmt(v)}</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ SETTLE UP ════ */}
      {tab === "settle" && (
        <div>
          {!settlements.length ? (
            <div className="border border-border rounded px-5 py-10 text-center">
              <p className="heading-serif text-xl text-foreground/30">All settled up</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground mb-4 uppercase tracking-widest">
                {settlements.length} payment{settlements.length !== 1 ? "s" : ""} to clear all debts
              </p>
              <div className="border border-border rounded overflow-hidden">
                {settlements.map((t, i) => {
                  const toProfile = group.memberProfiles?.[t.to];
                  const upiLink = toProfile?.upiId ? buildUPILink(toProfile.upiId, t.amt, t.to) : null;
                  const waLink = toProfile?.phone ? `https://wa.me/91${toProfile.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${t.to}, you have a pending payment of ${fmt(t.amt)} on Splitr. Please clear it at your earliest. 🙏`)}` : null;
                  return (
                    <div key={i} className={`px-5 py-4 ${i < settlements.length - 1 ? "border-b border-border" : ""}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                          {initials(t.from)}
                        </div>
                        <div className="flex-1">
                          <span className="text-[13px] text-foreground">{t.from}</span>
                          <span className="text-[12px] text-muted-foreground mx-2">→</span>
                          <span className="text-[13px] text-foreground">{t.to}</span>
                        </div>
                        <span className="num text-[14px] font-semibold text-foreground">{fmt(t.amt)}</span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {upiLink && (
                          <a href={upiLink} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-7 px-3 bg-foreground text-background rounded text-[11px] font-medium hover:opacity-85 transition-opacity">
                            <ExternalLink className="w-3 h-3" /> Pay via UPI
                          </a>
                        )}
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-7 px-3 bg-secondary border border-border rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                            Remind on WhatsApp
                          </a>
                        )}
                        {toProfile?.upiId && (
                          <button
                            onClick={() => setQrExpanded(qrExpanded === t.to ? null : t.to)}
                            className="inline-flex items-center gap-1.5 h-7 px-3 bg-secondary border border-border rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <QrCode className="w-3 h-3" />
                            {qrExpanded === t.to ? "Hide" : "Show"} QR
                          </button>
                        )}
                        {!toProfile?.upiId && (
                          <button onClick={() => { setTab("upi"); setUpiMember(t.to); openUpiPanel(t.to); }}
                            className="inline-flex items-center gap-1.5 h-7 px-3 bg-secondary border border-border rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                            + Add {t.to}'s UPI
                          </button>
                        )}
                      </div>
                      {/* QR display */}
                      {qrExpanded === t.to && toProfile?.upiId && (
                        <div className="mt-3 p-3 bg-secondary border border-border rounded animate-fade-in">
                          <p className="label-xs mb-2">UPI ID</p>
                          <p className="num text-[12px] text-foreground">{toProfile.upiId}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Open your UPI app and scan / search this ID to pay</p>
                          <a href={upiLink!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-foreground underline underline-offset-2 mt-2">
                            Open in UPI app <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════ UPI / PAY ════ */}
      {tab === "upi" && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-5 leading-relaxed">
            Add UPI IDs and phone numbers for members so payments can be made directly from the settle-up screen.
          </p>
          <div className="border border-border rounded overflow-hidden">
            {group.members.map((m, i) => {
              const profile = group.memberProfiles?.[m];
              const isEditing = upiMember === m;
              return (
                <div key={m} className={`px-5 py-4 ${i < group.members.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                      {initials(m)}
                    </div>
                    <span className="text-[13px] text-foreground flex-1">{m}</span>
                    {!isEditing && (
                      <button onClick={() => openUpiPanel(m)}
                        className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                        {profile?.upiId ? "Edit" : "+ Add UPI"}
                      </button>
                    )}
                  </div>

                  {profile?.upiId && !isEditing && (
                    <div className="ml-10 space-y-0.5">
                      <p className="num text-[11px] text-muted-foreground">{profile.upiId}</p>
                      {profile.phone && <p className="text-[11px] text-muted-foreground/60">+91 {profile.phone}</p>}
                      {/* Pending amount */}
                      {(() => {
                        const pending = pendingUnsettledAmount(m);
                        if (pending < 0.01) return null;
                        const link = buildUPILink(profile.upiId, pending, m);
                        return (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-muted-foreground">Pending: <span className="num text-foreground">{fmt(pending)}</span></span>
                            <a href={link} target="_blank" rel="noreferrer"
                              className="text-[10px] uppercase tracking-widest text-foreground underline underline-offset-2 hover:opacity-60 transition-opacity">
                              Pay now
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {isEditing && (
                    <div className="ml-10 space-y-2.5 animate-fade-in">
                      <div>
                        <label className="label-xs block mb-1.5">UPI ID</label>
                        <input
                          className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
                          placeholder="name@bank or phone@upi"
                          value={upiInput}
                          onChange={e => setUpiInput(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="label-xs block mb-1.5">Phone (for WhatsApp reminders)</label>
                        <input
                          className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
                          placeholder="10-digit mobile number"
                          value={upiPhone}
                          onChange={e => setUpiPhone(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveUpi} className="h-7 px-3 bg-foreground text-background rounded text-[11px] font-medium hover:opacity-90 transition-opacity">
                          Save
                        </button>
                        <button onClick={() => setUpiMember(null)} className="h-7 px-3 bg-secondary border border-border rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddExpenseDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        members={group.members}
        onAddExpense={(desc, amount, payer, splitAmong, category) => { onAddExpense(desc, amount, payer, splitAmong, category); setShowAdd(false); }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={confirmDelete?.type === "group" ? "Delete group?" : "Delete expense?"}
        description={confirmDelete?.type === "group" ? "All expenses will be permanently removed." : "This cannot be undone."}
        onConfirm={() => {
          if (confirmDelete?.type === "group") onDeleteGroup();
          else if (confirmDelete?.id) onDeleteExpense(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

/* ── Inline expense row with edit mode ── */
interface ExpenseRowProps {
  expense: import("@/hooks/useExpenseStore").Expense;
  members: string[];
  isEditing: boolean;
  isLast: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updates: Partial<{ desc: string; amount: number; payer: string; splitAmong: string[]; category: string }>) => void;
  onToggleSettle: () => void;
  onDelete: () => void;
}

function ExpenseRow({ expense: e, members, isEditing, isLast, onStartEdit, onCancelEdit, onSaveEdit, onToggleSettle, onDelete }: ExpenseRowProps) {
  const [desc, setDesc] = useState(e.desc);
  const [amount, setAmount] = useState(String(e.amount));
  const [payer, setPayer] = useState(e.payer);
  const [category, setCategory] = useState(e.category);
  const [split, setSplit] = useState<Set<string>>(new Set(e.splitAmong));

  const toggleSplit = (m: string) => {
    const next = new Set(split);
    if (next.has(m)) next.delete(m); else next.add(m);
    setSplit(next);
  };

  if (isEditing) {
    return (
      <div className={`px-5 py-4 bg-secondary/30 animate-fade-in ${!isLast ? "border-b border-border" : ""}`}>
        <div className="space-y-3">
          <input
            className="w-full h-8 px-2.5 bg-secondary border border-border-md rounded text-[13px] text-foreground focus:outline-none"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number" min="0.01" step="0.01"
              className="h-8 px-2.5 bg-secondary border border-border-md rounded text-[12px] text-foreground focus:outline-none"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
            />
            <select
              className="h-8 px-2.5 bg-secondary border border-border-md rounded text-[12px] text-foreground focus:outline-none cursor-pointer"
              value={payer}
              onChange={e => setPayer(e.target.value)}
            >
              {members.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <p className="label-xs mb-1.5">Split among</p>
            <div className="flex flex-wrap gap-1.5">
              {members.map(m => (
                <button key={m} onClick={() => toggleSplit(m)}
                  className={`h-6 px-2.5 rounded text-[11px] border transition-all ${split.has(m) ? "bg-foreground text-background border-foreground" : "bg-secondary border-border text-muted-foreground"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSaveEdit({ desc: desc.trim(), amount: parseFloat(amount), payer, splitAmong: [...split], category })}
              className="h-7 px-3 bg-foreground text-background rounded text-[11px] font-medium hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
            <button onClick={onCancelEdit} className="h-7 px-3 bg-secondary border border-border rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
          {e.editedAt && (
            <p className="text-[10px] text-muted-foreground/40">
              Edited {new Date(e.editedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-4 px-5 py-4 row-hover ${e.settled ? "opacity-40" : ""} ${!isLast ? "border-b border-border" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">{e.desc}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {e.payer} · {CATEGORY_LABELS[e.category] || "General"} · {e.date}
          {e.splitAmong.length > 1 && ` · split ${e.splitAmong.length}`}
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={onToggleSettle} className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            {e.settled ? "Unsettle" : "Settle"}
          </button>
          <button onClick={onStartEdit} className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Edit
          </button>
          <button onClick={onDelete} className="text-[11px] uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            Delete
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="num text-[14px] font-semibold text-foreground">{fmt(e.amount)}</p>
        <p className="num text-[11px] text-muted-foreground">{fmt(e.amount / e.splitAmong.length)}/ea</p>
        {e.settled && <p className="text-[10px] text-muted-foreground/40 mt-0.5">settled</p>}
      </div>
    </div>
  );
}
