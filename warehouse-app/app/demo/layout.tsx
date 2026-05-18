import { DemoProvider } from "@/lib/demo/store";
import { DemoSidebar } from "@/components/demo/DemoSidebar";
import { DemoTopbar } from "@/components/demo/DemoTopbar";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div className="flex h-screen overflow-hidden">
        <DemoSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <DemoTopbar />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </DemoProvider>
  );
}
