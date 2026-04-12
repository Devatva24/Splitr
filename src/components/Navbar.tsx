import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { NewGroupDialog } from "./NewGroupDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { initials } from "@/hooks/useExpenseStore";

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const store = useStore(); // ← shared context, always in sync
  const navigate = useNavigate();
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const totalExpenses = store.groups.reduce((s, g) => s + g.expenses.length, 0);

  const navItems = [
    { to: "/", label: "Groups", exact: true },
    { to: "/history", label: "History" },
    { to: "/analytics", label: "Analytics" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-5 border-b border-border bg-background/95 backdrop-blur-sm">
        {/* Wordmark */}
        <span className="font-serif-italic text-[15px] text-foreground mr-8 select-none tracking-tight">
          Splitr
        </span>

        {/* Nav */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "text-[11px] font-medium tracking-widest uppercase transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-5">
          <button
            onClick={() => setShowNewGroup(true)}
            className="hidden md:block text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            + New group
          </button>

          {/* Avatar / user menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-semibold text-muted-foreground hover:border-border-md transition-colors"
            >
              {currentUser ? initials(currentUser.name) : "–"}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-md shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3.5 border-b border-border">
                    <p className="text-[13px] font-medium text-foreground truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{currentUser?.email}</p>
                  </div>
                  <div className="px-4 py-3 border-b border-border">
                    <p className="num text-[11px] text-muted-foreground">
                      {store.groups.length} group{store.groups.length !== 1 ? "s" : ""} · {totalExpenses} expense{totalExpenses !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => { logout(); navigate("/login"); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-3 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-12 flex items-center bg-background border-t border-border px-5 gap-6">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn("text-[11px] uppercase tracking-widest transition-colors", isActive ? "text-foreground" : "text-muted-foreground")
            }
          >
            {item.label}
          </NavLink>
        ))}
        <button onClick={() => setShowNewGroup(true)} className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground">
          + New
        </button>
      </div>

      <NewGroupDialog
        open={showNewGroup}
        onOpenChange={setShowNewGroup}
        onCreateGroup={(name, members, emoji) => { store.addGroup(name, members, emoji); setShowNewGroup(false); }}
      />
    </>
  );
}
