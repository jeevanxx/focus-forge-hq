import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Home, Calendar, ListChecks, Flame, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/", label: "Today", icon: Home },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export const Sidebar = () => {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
        <div className="relative h-8 w-8 rounded-lg bg-gradient-ember shadow-ember grid place-items-center">
          <Flame className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight">Focus Forge</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Discipline OS</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-foreground shadow-soft ring-1 ring-border"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-4 w-4", isActive && "text-primary")} strokeWidth={2} />
                <span className="font-medium">{label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-ember" />}
              </>
            )}
          </RouterNavLink>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-xl bg-gradient-card border border-border shadow-soft">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Streak</span>
        </div>
        <div className="font-display text-2xl font-semibold">12 days</div>
        <div className="text-xs text-muted-foreground mt-0.5">Don't break the chain</div>
      </div>
    </aside>
  );
};

export const MobileTopBar = () => (
  <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 h-14 border-b border-border bg-background/80 backdrop-blur-xl">
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-md bg-gradient-ember grid place-items-center">
        <Flame className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="font-display text-base font-semibold">Focus Forge</span>
    </div>
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border">
      <Flame className="h-3 w-3 text-primary" />
      <span className="text-xs font-semibold">12</span>
    </div>
  </header>
);

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <div className="flex items-center justify-around bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-elev px-2 py-1.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <RouterNavLink
              key={to}
              to={to}
              end={to === "/"}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
};
