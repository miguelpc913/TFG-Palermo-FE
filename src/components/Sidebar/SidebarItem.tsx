import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "../../Types/Document";
import { useHash } from "react-use";

type Props = {
  docUrl: AutomergeUrl;
};

export default function SidebarItem({ docUrl }: Props) {
  const [doc] = useDocument<Page>(docUrl, {
    suspense: true,
  });
  const [_, setHash] = useHash();

  const onSelectItem = (url: AutomergeUrl | null) => {
    if (url) {
      setHash(url);
    } else {
      setHash("");
    }
  };
  // const docTitle = doc.blocks[0].type === "heading" ? doc.blocks[0].content[0] : "Untitled page";
  // console.log(doc.blocks[0].content[0]);
  return (
    <div>
      <span
        onClick={() => {
          onSelectItem(docUrl);
        }}
      >
        {"untitled"}
      </span>
      {doc.children ? (
        <div style={{ paddingLeft: "20px", paddingTop: "10px" }}>
          {doc.children.map(docUrl => (
            <SidebarItem docUrl={docUrl} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
