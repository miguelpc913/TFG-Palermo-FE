// AppSidebar.tsx
import { Suspense, useState } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  Sidebar,
  SidebarMenuSkeleton,
} from "../ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/types/Document";
import SidebarNode from "./SidebarItem/SidebarNode";

import AppSidebarHeader from "./SidebarHeader/AppSidebarHeader";

type Props = {
  rootDocUrl: AutomergeUrl;
};

export default function AppSidebar({ rootDocUrl }: Props) {
  const [root] = useDocument<Page>(rootDocUrl);
  const children: AutomergeUrl[] = root?.children || [];
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <Sidebar>
      <AppSidebarHeader rootDocUrl={rootDocUrl} setSearchQuery={setSearchQuery} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Suspense since useDocument is used with suspense: true */}
              <Suspense fallback={<SidebarMenuSkeleton />}>
                {children.map(childUrl => (
                  <Suspense fallback={<SidebarMenuSkeleton />} key={childUrl}>
                    <SidebarNode key={childUrl} docUrl={childUrl} searchQuery={searchQuery} />
                  </Suspense>
                ))}
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
