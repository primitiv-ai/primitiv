import { BookOpen, FileText, Home, Scale, ScrollText, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarLink } from "./sidebar-link";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card/50 p-4">
      <div className="mb-4 px-3">
        <h2 className="text-lg font-semibold tracking-tight">Primitiv</h2>
        <p className="text-xs text-muted-foreground">Governance viewer</p>
      </div>
      <Separator className="mb-4" />
      <nav className="flex flex-col gap-1">
        <SidebarLink href="/" icon={<Home size={16} />}>
          Dashboard
        </SidebarLink>
        <SidebarLink href="/specs" icon={<FileText size={16} />}>
          Specs
        </SidebarLink>
        <SidebarLink href="/gates" icon={<Scale size={16} />}>
          Gates
        </SidebarLink>
        <SidebarLink href="/constitutions" icon={<ScrollText size={16} />}>
          Constitutions
        </SidebarLink>
        <SidebarLink href="/learnings" icon={<Lightbulb size={16} />}>
          Learnings
        </SidebarLink>
      </nav>
      <Separator className="my-4" />
      <div className="mt-auto flex items-center gap-2 px-3 text-xs text-muted-foreground">
        <BookOpen size={14} />
        <span>Read-only</span>
      </div>
    </aside>
  );
}
