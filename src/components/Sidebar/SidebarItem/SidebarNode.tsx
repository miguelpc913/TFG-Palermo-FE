import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub } from "@/components/ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/types/Document";

type Props = { docUrl: AutomergeUrl; searchQuery: string };

export default function SidebarNode({ docUrl, searchQuery }: Props) {
  const [doc] = useDocument<Page>(docUrl, { suspense: true });

  const title =
    doc?.blocks?.[0]?.type === "heading" && doc?.blocks?.[0]?.content?.[0]?.text
      ? (doc.blocks[0].content[0].text as string)
      : "Untitled page";

  const children = doc?.children || [];
  const isNotResult =
    searchQuery && searchQuery.trim().length > 0 && !title.toLowerCase().includes(searchQuery);

  return (
    <>
      {isNotResult ? null : (
        <SidebarMenuItem key={docUrl}>
          <SidebarMenuButton asChild>
            <a href={`#${docUrl}`}>
              <span>{title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {children.length > 0 && (
        <SidebarMenuSub>
          {children.map(childUrl => (
            <SidebarNode searchQuery={searchQuery} key={childUrl} docUrl={childUrl} />
          ))}
        </SidebarMenuSub>
      )}
    </>
  );
}
