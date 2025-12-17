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
import { ErrorBoundary } from "./SidebarItemErrorBoundary/SidebarItemErrorBoundary";

type Props = {
  rootDocUrl: AutomergeUrl;
};

export default function AppSidebar({ rootDocUrl }: Props) {
  const [rootDoc, changeRootDoc] = useDocument<Page>(rootDocUrl, { suspense: true });
  const children: AutomergeUrl[] = rootDoc?.children || [];
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
                  <ErrorBoundary
                    onError={e => {
                      changeRootDoc(d => {
                        const indexToDelete = d.children.findIndex(url => url === childUrl);
                        if (indexToDelete > -1) {
                          d.children.splice(indexToDelete, 1);
                        }
                      });
                      console.log("Caught by boundary:", e);
                    }}
                    key={childUrl}
                  >
                    <Suspense
                      fallback={<SidebarMenuSkeleton data-testid={"sidebar-skeleton-menu-item"} />}
                    >
                      <SidebarNode key={childUrl} docUrl={childUrl} searchQuery={searchQuery} />
                    </Suspense>
                  </ErrorBoundary>
                ))}
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
