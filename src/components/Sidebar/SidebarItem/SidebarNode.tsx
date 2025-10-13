import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub } from "@/components/ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/Types/Document";

type Props = { docUrl: AutomergeUrl };

/** Recursive component: each instance calls useDocument once (Rules of Hooks ✓) */
export default function SidebarNode({ docUrl }: Props) {
  const [doc] = useDocument<Page>(docUrl, { suspense: true });

  const title =
    doc?.blocks?.[0]?.type === "heading" && doc?.blocks?.[0]?.content?.[0]?.text
      ? doc.blocks[0].content[0].text
      : "Untitled page";

  const children = doc?.children || [];

  return (
    <>
      <SidebarMenuItem key={docUrl}>
        <SidebarMenuButton asChild>
          <a href={`#${docUrl}`}>
            <span>{title}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {children.length > 0 && (
        <SidebarMenuSub>
          {children.map(childUrl => (
            <SidebarNode key={childUrl} docUrl={childUrl} />
          ))}
        </SidebarMenuSub>
      )}
    </>
  );
}
