import { ReactNode } from "react";
import { Sidebar, MobileBottomNav, MobileTopBar } from "./Navigation";
import { AssistantFab } from "./assistant/AssistantFab";
import { CommandPalette } from "./CommandPalette";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 pb-28 lg:pb-8 relative z-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <AssistantFab />
      <CommandPalette />
    </div>
  );
};
