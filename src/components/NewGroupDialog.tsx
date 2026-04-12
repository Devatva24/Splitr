import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (name: string, members: string[], emoji: string) => void;
}

const EMOJIS = ["✈️", "🏠", "🍕", "🏖️", "🎒", "🎊", "🏔️", "🚗", "🎸", "💼", "🎯", "🍜"];

export function NewGroupDialog({ open, onOpenChange, onCreateGroup }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✈️");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; members?: string; dup?: string }>({});

  const reset = () => { setName(""); setMemberInput(""); setMembers([]); setErrors({}); setEmoji("✈️"); };

  const addMember = () => {
    const val = memberInput.trim();
    if (!val) return;
    if (members.map(m => m.toLowerCase()).includes(val.toLowerCase())) {
      setErrors(e => ({ ...e, dup: "Already added" })); return;
    }
    setErrors(e => ({ ...e, dup: undefined }));
    setMembers([...members, val]);
    setMemberInput("");
  };

  const handleSubmit = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Required";
    if (members.length < 2) errs.members = "Add at least 2 members";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onCreateGroup(name.trim(), members, emoji);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">New group</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Emoji */}
          <div>
            <label className="label-xs block mb-2">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-all border ${
                    emoji === e
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary border-border hover:border-border-md"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label-xs block mb-2">Group name</label>
            <input
              className="w-full h-9 px-3 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
              placeholder="e.g. Goa Trip"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && document.getElementById("ng-member")?.focus()}
            />
            {errors.name && <p className="text-xs text-muted-foreground mt-1">{errors.name}</p>}
          </div>

          {/* Members */}
          <div>
            <label className="label-xs block mb-2">Members</label>
            <div className="flex gap-2">
              <input
                id="ng-member"
                className="flex-1 h-9 px-3 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-md transition-colors"
                placeholder="Name"
                value={memberInput}
                onChange={e => setMemberInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
              />
              <button
                onClick={addMember}
                className="h-9 px-3 bg-secondary border border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-border-md transition-colors"
              >
                Add
              </button>
            </div>
            {errors.dup && <p className="text-xs text-muted-foreground mt-1">{errors.dup}</p>}

            {members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {members.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 bg-secondary border border-border rounded text-xs text-muted-foreground">
                    {m}
                    <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="hover:text-foreground transition-colors">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.members && <p className="text-xs text-muted-foreground mt-1.5">{errors.members}</p>}
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
              Create
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
