import { useState } from "react";
import { fmt, CATEGORY_LABELS } from "@/hooks/useExpenseStore";
import { useStore } from "@/contexts/StoreContext";

const History = () => {
  const store = useStore();
  const [filter, setFilter] = useState("all");

  const allExpenses = store.groups
    .flatMap(g => g.expenses.map(e => ({ ...e, groupName: g.name, groupId: g.id })))
    .sort((a, b) => b.createdAt - a.createdAt);

  const filtered = filter === "all" ? allExpenses : allExpenses.filter(e => e.groupId === filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-14 pb-20 md:pb-8">
      <div className="flex items-end justify-between mb-8 pt-6">
        <div>
          <h1 className="heading-serif text-3xl text-foreground">History</h1>
          {filtered.length > 0 && (
            <p className="num text-[11px] text-muted-foreground mt-1">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} · {fmt(total)}
            </p>
          )}
        </div>
      </div>

      {store.groups.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {[{ id: "all", name: "All" }, ...store.groups.map(g => ({ id: g.id, name: g.name }))].map(g => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={`h-6 px-3 rounded text-[11px] border transition-all ${
                filter === g.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary border-border text-muted-foreground hover:border-border-md"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {!filtered.length ? (
        <div className="border border-border rounded px-5 py-12 text-center">
          <p className="heading-serif text-xl text-foreground/20">No transactions</p>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden animate-fade-in">
          {filtered.map((e, i) => (
            <div key={e.id} className={`flex items-start gap-4 px-5 py-4 row-hover ${e.settled ? "opacity-40" : ""} ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{e.desc}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span className="text-foreground/50">{e.groupName}</span>
                  {" · "}{e.payer} · {CATEGORY_LABELS[e.category] || "General"} · {e.date}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="num text-[13px] font-medium text-foreground">{fmt(e.amount)}</p>
                {e.settled && <p className="text-[10px] text-muted-foreground/40 mt-0.5">settled</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
