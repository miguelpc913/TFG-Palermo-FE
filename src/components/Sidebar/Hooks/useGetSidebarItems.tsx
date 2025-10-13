import { Page } from "@/Types/Document";
import { AutomergeUrl, useDocument } from "@automerge/react";

const ROOT_DOC_URL_KEY = "root-doc-url-4";

export default function useGetSidebarItems() {
  const rootUrl = localStorage.getItem(ROOT_DOC_URL_KEY) as AutomergeUrl;
  const [doc] = useDocument<Page>(rootUrl, {
    suspense: true,
  });

  const docChildrenItems = doc.children.map(docUrl => {
    const items = useSidebarPageItem({ docUrl });
    return items;
  });
  return docChildrenItems;
}

type Props = {
  docUrl: AutomergeUrl;
};

type MenuItem = {
  title: string;
  url: AutomergeUrl;
  children: MenuItem[];
};

function useSidebarPageItem({ docUrl }: Props) {
  const [doc] = useDocument<Page>(docUrl, {
    suspense: true,
  });

  const docTitle =
    doc.blocks && doc.blocks[0].type === "heading" && doc.blocks[0].content[0]
      ? doc.blocks[0].content[0].text
      : "Untitled page";
  const docItem = {
    title: docTitle,
    url: docUrl,
    children: [],
  } as MenuItem;

  const docChildren: AutomergeUrl[] = doc.children || [];
  const docChildrenItems = docChildren.map(docUrl => {
    const items = useSidebarPageItem({ docUrl });
    return items;
  });
  docItem.children = docChildrenItems;
  return docItem;
}
