import { Moon, Sun, Search as SearchIcon, Menu } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function AdminTopbar({ onOpenPalette, onToggleSidebar, userEmail }: { onOpenPalette: () => void; onToggleSidebar: () => void; userEmail?: string | null }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:inline-flex">
        <Menu className="h-4 w-4" />
      </Button>
      <button
        onClick={onOpenPalette}
        className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 md:max-w-md"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search or jump to…</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {userEmail && (
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <div className="font-medium text-foreground">Admin</div>
            <div className="truncate max-w-[160px]">{userEmail}</div>
          </div>
        )}
      </div>
    </header>
  );
}
