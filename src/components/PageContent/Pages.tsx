import React from "react";
import { useDocument, AutomergeUrl } from "@automerge/react";
import { Page } from "../../Types/Document";
import Editor from "../Editor/Editor";

export const PageContent: React.FC<{
  selectedDocUrl: AutomergeUrl;
}> = ({ selectedDocUrl }) => {
  const [doc, changeDoc] = useDocument<Page>(selectedDocUrl, { suspense: true });
  return <Editor doc={doc} changeDoc={changeDoc} />;
};
