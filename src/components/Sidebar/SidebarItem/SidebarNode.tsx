import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub } from "@/components/ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/types/Document";
import { useHash } from "react-use";
import { useEffect, useState } from "react";

type Props = { docUrl: AutomergeUrl; searchQuery: string };

export default function SidebarNode({ docUrl, searchQuery }: Props) {
  const [doc] = useDocument<Page>(docUrl, { suspense: true });
  const [hash] = useHash();
  const [isNotResult, setIsNotResult] = useState(false);

  const title =
    doc?.blocks?.[0]?.type === "heading" && doc?.blocks?.[0]?.content?.[0]?.text
      ? (doc.blocks[0].content[0].text as string)
      : "Untitled page";

  const children = doc?.children || [];
  useEffect(() => {
    const isNotResult =
      searchQuery.trim().length > 0 && !title.toLowerCase().includes(searchQuery.toLowerCase());

    setIsNotResult(isNotResult);
  }, [searchQuery, title]);
  const isSelected = hash.replace("#", "") === docUrl;
  return (
    <>
      {isNotResult ? null : (
        <SidebarMenuItem key={docUrl}>
          <SidebarMenuButton asChild>
            <a href={`#${docUrl}`}>
              <span className={`${isSelected ? "font-semibold" : ""}`}>{title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {children.length > 0 && (
        <SidebarMenuSub className="mr-0 pr-0">
          {children.map(childUrl => (
            <SidebarNode searchQuery={searchQuery} key={childUrl} docUrl={childUrl} />
          ))}
        </SidebarMenuSub>
      )}
    </>
  );
}
