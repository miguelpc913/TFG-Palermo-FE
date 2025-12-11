// AppSidebar.tsx
import { Suspense, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <Sidebar>
      <SidebarHeader className="border-b-1 border-b-gray-200">
        {accountEmail ? (
          <div className="flex gap-2 m-2">
            <EmailLogo email={accountEmail} size="sm" />
            <SidebarGroupLabel>{accountEmail}</SidebarGroupLabel>
          </div>
        ) : null}

        <SearchForm
          onChange={e => {
            const value = e.target.value || "";
            setSearchQuery(value);
          }}
        />
        <NewPageButton docUrl={rootDocUrl} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Suspense since useDocument is used with suspense: true */}
              <Suspense fallback={null}>
                <SidebarRootChildren rootUrl={rootDocUrl} searchQuery={searchQuery} />
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** Loads the root doc once and renders *its children* as tree nodes */
function SidebarRootChildren({
  rootUrl,
  searchQuery,
}: {
  rootUrl: AutomergeUrl;
  searchQuery: string;
}) {
  const [root] = useDocument<Page>(rootUrl);
  const children: AutomergeUrl[] = root?.children || [];
  return (
    <Suspense fallback={null}>
      {children.map(childUrl => (
        <Suspense fallback={null} key={childUrl}>
          <SidebarNode key={childUrl} docUrl={childUrl} searchQuery={searchQuery} />
        </Suspense>
      ))}
    </Suspense>
  );
}
