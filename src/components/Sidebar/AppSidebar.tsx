// AppSidebar.tsx
import { Suspense } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  Sidebar,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarGroupLabel,
} from "../ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/types/Document";
import SidebarNode from "./SidebarItem/SidebarNode";
import NewPageButton from "./NewPageButton/NewPageButton";
import { SearchForm } from "./Search/SearchSidebar";
import { EmailLogo } from "./EmailLogo/EmailLogo";

type Props = {
  rootDocUrl: AutomergeUrl;
};

export default function AppSidebar({ rootDocUrl }: Props) {
  const accountEmail = localStorage.getItem("email");
  return (
    <Sidebar>
      <SidebarHeader>
        {accountEmail ? (
          <div className="flex gap-2 m-2">
            <EmailLogo email={accountEmail} size="sm" />
            <SidebarGroupLabel>{accountEmail}</SidebarGroupLabel>
          </div>
        ) : null}

        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Suspense since useDocument is used with suspense: true */}
              <Suspense fallback={null}>
                <SidebarRootChildren rootUrl={rootDocUrl} />
              </Suspense>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NewPageButton docUrl={rootDocUrl} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** Loads the root doc once and renders *its children* as tree nodes */
function SidebarRootChildren({ rootUrl }: { rootUrl: AutomergeUrl }) {
  const [root] = useDocument<Page>(rootUrl);
  const children: AutomergeUrl[] = root?.children || [];
  return (
    <Suspense fallback={null}>
      {children.map(childUrl => (
        <Suspense fallback={null} key={childUrl}>
          <SidebarNode key={childUrl} docUrl={childUrl} />
        </Suspense>
      ))}
    </Suspense>
  );
}
