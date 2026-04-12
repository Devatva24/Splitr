import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORY_LABELS } from "@/hooks/useExpenseStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: string[];
  onAddExpense: (desc: string, amount: number, payer: string, splitAmong: string[], category: string) => void;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS);

export function AddExpenseDialog({ open, onOpenChange, members, onAddExpense }: Props) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(members[0] || "");
  const [category, setCategory] = useState("general");
  const [selected, setSelected] = useState<Set<string>>(new Set(members));
  const [errors, setErrors] = useState<{ desc?: string; amt?: string; split?: string }>({});

  useEffect(() => {
    if (open) { setDesc(""); setAmount(""); setPayer(members[0] || ""); setCategory("general"); setSelected(new Set(members)); setErrors({}); }
  }, [open, members]);

  const toggleMember = (m: string) => {
    const next = new Set(selected);
    if (next.has(m)) next.delete(m); else next.add(m);
    setSelected(next);
  };

  const handleSubmit = () => {
    const errs: typeof errors = {};
    if (!desc.trim()) errs.desc = "Required";
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || isNaN(amt)) errs.amt = "Enter a valid amount";
    if (selected.size === 0) errs.split = "Select at least one person";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onAddExpense(desc.trim(), amt, payer, [...selected], category);
  };

  const perPerson = selected.size > 0 && parseFloat(amount) > 0
    ? (parseFloat(amount) / selected.size).toFixed(2) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">Add expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Description */}
          <div>
            <label className="label-xs block mb-2">Description</label>
            <input
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
              placeholder="e.g. Dinner, Hotel, Cab"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              autoFocus
            />
            {errors.desc && <p className="text-xs text-muted-foreground mt-1">{errors.desc}</p>}
          </div>

          {/* Amount + Payer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs block mb-2">Amount (₹)</label>
              <input
                type="number" min="0.01" step="0.01"
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              {errors.amt && <p className="text-xs text-muted-foreground mt-1">{errors.amt}</p>}
            </div>
            <div>
              <label className="label-xs block mb-2">Paid by</label>
              <select
                className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-border-md transition-colors cursor-pointer"
                value={payer}
                onChange={e => setPayer(e.target.value)}
              >
                {members.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label-xs block mb-2">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`h-6 px-2.5 rounded text-xs border transition-all ${
                    category === key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:border-border-md"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Split among */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="label-xs">Split among</label>
              {perPerson && (
                <span className="text-xs text-muted-foreground num">₹{perPerson} / person</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {members.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMember(m)}
                  className={`h-7 px-3 rounded text-xs border transition-all ${
                    selected.has(m)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:border-border-md"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {errors.split && <p className="text-xs text-muted-foreground mt-1">{errors.split}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 bg-secondary border border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-border-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-9 bg-foreground text-background rounded text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Add expense
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
