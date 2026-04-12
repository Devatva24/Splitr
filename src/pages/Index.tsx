import { useState } from "react";
import { fmt, initials } from "@/hooks/useExpenseStore";
import { useStore } from "@/contexts/StoreContext";
import { NewGroupDialog } from "@/components/NewGroupDialog";
import { GroupDetail } from "@/components/GroupDetail";

const Index = () => {
  const store = useStore();
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const currentGroup = currentGroupId ? store.getGroup(currentGroupId) : undefined;

  if (currentGroup) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-14 pb-20 md:pb-8 animate-fade-in">
        <GroupDetail
          group={currentGroup}
          onBack={() => setCurrentGroupId(null)}
          onDeleteGroup={() => { store.deleteGroup(currentGroup.id); setCurrentGroupId(null); }}
          onEditGroup={(name, emoji) => store.editGroup(currentGroup.id, name, emoji)}
          onAddExpense={(desc, amt, payer, split, cat) => store.addExpense(currentGroup.id, desc, amt, payer, split, cat)}
          onEditExpense={(eid, updates) => store.editExpense(currentGroup.id, eid, updates)}
          onToggleSettle={eid => store.toggleSettle(currentGroup.id, eid)}
          onDeleteExpense={eid => store.deleteExpense(currentGroup.id, eid)}
          onSetMemberUPI={(member, profile) => store.setMemberUPI(currentGroup.id, member, profile)}
        />
      </div>
    );
  }

  const totalUnsettled = store.groups.reduce((s, g) =>
    s + g.expenses.filter(e => !e.settled).reduce((a, e) => a + e.amount, 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-14 pb-20 md:pb-8">
      {/* Page header */}
      <div className="flex items-end justify-between mb-8 pt-6">
        <div>
          <h1 className="heading-serif text-3xl text-foreground">Groups</h1>
          {store.groups.length > 0 && (
            <p className="num text-[11px] text-muted-foreground mt-1">
              {store.groups.length} group{store.groups.length !== 1 ? "s" : ""} · {fmt(totalUnsettled)} unsettled
            </p>
          )}
        </div>
        <button
          onClick={() => setShowNewGroup(true)}
          className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          + New
        </button>
      </div>

      {!store.groups.length ? (
        <div className="animate-fade-in border border-border rounded-md px-8 py-14 text-center">
          <p className="heading-serif text-2xl text-foreground/20 mb-3">No groups yet</p>
          <p className="text-[12px] text-muted-foreground mb-6 leading-relaxed">
            Create a group to start tracking<br/>shared expenses with friends.
          </p>
          <button
            onClick={() => setShowNewGroup(true)}
            className="text-[11px] uppercase tracking-widest text-foreground underline underline-offset-4 hover:opacity-60 transition-opacity"
          >
            Create first group
          </button>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden animate-fade-in">
          {store.groups.map((g, i) => {
            const unsettled = g.expenses.filter(e => !e.settled);
            const total = unsettled.reduce((s, e) => s + e.amount, 0);
            const isLast = i === store.groups.length - 1;
            return (
              <div
                key={g.id}
                onClick={() => setCurrentGroupId(g.id)}
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer row-hover ${!isLast ? "border-b border-border" : ""}`}
              >
                <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center text-base flex-shrink-0">
                  {g.emoji || "·"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{g.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex -space-x-1">
                      {g.members.slice(0, 5).map(m => (
                        <div key={m} className="w-4 h-4 rounded-full bg-secondary border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground" title={m}>
                          {initials(m)[0]}
                        </div>
                      ))}
                      {g.members.length > 5 && (
                        <div className="w-4 h-4 rounded-full bg-secondary border border-background flex items-center justify-center text-[8px] text-muted-foreground">
                          +{g.members.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {unsettled.length} active · {g.members.length} members
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="num text-[13px] font-medium text-foreground">{fmt(total)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">unsettled</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewGroupDialog
        open={showNewGroup}
        onOpenChange={setShowNewGroup}
        onCreateGroup={(name, members, emoji) => { store.addGroup(name, members, emoji); setShowNewGroup(false); }}
      />
    </div>
  );
};

export default Index;
