
import { ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
    <div className="flex h-screen w-full">
      {/* Sidebar */}
     <AppSidebar/>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-background p-6">
        {children}
      </div>
    </div>
    </SidebarProvider>
  );
}
