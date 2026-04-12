import { fmt, initials, CATEGORY_LABELS } from "@/hooks/useExpenseStore";
import { useStore } from "@/contexts/StoreContext";

const Analytics = () => {
  const store = useStore();
  const allExpenses = store.groups.flatMap(g => g.expenses.map(e => ({ ...e, groupName: g.name })));
  const total = allExpenses.reduce((s, e) => s + e.amount, 0);
  const settled = allExpenses.filter(e => e.settled).reduce((s, e) => s + e.amount, 0);
  const avg = allExpenses.length ? total / allExpenses.length : 0;

  const catTotals: Record<string, number> = {};
  allExpenses.forEach(e => { catTotals[e.category || "general"] = (catTotals[e.category || "general"] || 0) + e.amount; });
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0]?.[1] || 1;

  const groupTotals = store.groups.map(g => ({
    name: g.name, emoji: g.emoji,
    total: g.expenses.reduce((s, e) => s + e.amount, 0),
  })).sort((a, b) => b.total - a.total);
  const maxGroup = groupTotals[0]?.total || 1;

  const spenderMap: Record<string, number> = {};
  allExpenses.forEach(e => { spenderMap[e.payer] = (spenderMap[e.payer] || 0) + e.amount; });
  const topSpenders = Object.entries(spenderMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSpend = topSpenders[0]?.[1] || 1;

  if (!allExpenses.length) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-14 pb-20 md:pb-8">
        <div className="pt-6 mb-8"><h1 className="heading-serif text-3xl text-foreground">Analytics</h1></div>
        <div className="border border-border rounded px-5 py-12 text-center">
          <p className="heading-serif text-xl text-foreground/20">No data yet</p>
          <p className="text-[12px] text-muted-foreground mt-2">Add expenses to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-14 pb-20 md:pb-8 animate-fade-in">
      <div className="pt-6 mb-8">
        <h1 className="heading-serif text-3xl text-foreground">Analytics</h1>
        <p className="num text-[11px] text-muted-foreground mt-1">{allExpenses.length} transactions across {store.groups.length} groups</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded overflow-hidden mb-6">
        {[
          { label: "Total tracked", value: fmt(total) },
          { label: "Settled", value: fmt(settled) },
          { label: "Avg expense", value: fmt(avg) },
          { label: "Settlement %", value: total > 0 ? `${((settled / total) * 100).toFixed(0)}%` : "—" },
        ].map(s => (
          <div key={s.label} className="bg-card px-4 py-3">
            <p className="label-xs mb-1.5">{s.label}</p>
            <p className="num text-[15px] font-semibold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Groups */}
      {groupTotals.length > 0 && (
        <div className="mb-5">
          <p className="label-xs mb-4">By group</p>
          <div className="border border-border rounded overflow-hidden">
            {groupTotals.map((g, i) => (
              <div key={g.name} className={`flex items-center gap-4 px-5 py-3.5 row-hover ${i < groupTotals.length - 1 ? "border-b border-border" : ""}`}>
                <span className="text-base w-6 flex-shrink-0">{g.emoji || "·"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[12px] text-foreground truncate">{g.name}</span>
                    <span className="num text-[12px] text-foreground ml-3 flex-shrink-0">{fmt(g.total)}</span>
                  </div>
                  <div className="h-px bg-border w-full overflow-hidden">
                    <div className="h-full bg-foreground/35 transition-all duration-500" style={{ width: `${(g.total / maxGroup) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catEntries.length > 0 && (
          <div>
            <p className="label-xs mb-4">By category</p>
            <div className="border border-border rounded overflow-hidden">
              {catEntries.map(([cat, amt], i) => (
                <div key={cat} className={`flex items-center gap-3 px-4 py-3 row-hover ${i < catEntries.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="num text-[11px] text-foreground">{fmt(amt)}</span>
                    </div>
                    <div className="h-px bg-border w-full overflow-hidden">
                      <div className="h-full bg-foreground/25 transition-all duration-500" style={{ width: `${(amt / maxCat) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topSpenders.length > 0 && (
          <div>
            <p className="label-xs mb-4">Top payers</p>
            <div className="border border-border rounded overflow-hidden">
              {topSpenders.map(([name, amt], i) => (
                <div key={name} className={`flex items-center gap-3 px-4 py-3 row-hover ${i < topSpenders.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-[12px] text-foreground truncate">{name}</span>
                      <span className="num text-[11px] text-foreground ml-2">{fmt(amt)}</span>
                    </div>
                    <div className="h-px bg-border w-full overflow-hidden">
                      <div className="h-full bg-foreground/25 transition-all duration-500" style={{ width: `${(amt / maxSpend) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
