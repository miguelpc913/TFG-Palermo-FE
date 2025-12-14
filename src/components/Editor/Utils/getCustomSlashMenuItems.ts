import { Page } from "@/types/Document";
import { ChangeFn, Repo } from "@automerge/react";
import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem, getDefaultReactSlashMenuItems } from "@blocknote/react";
import insertNewPageBlock from "./insertNewPageBlock";

const getCustomSlashMenuItems = (
  editor: BlockNoteEditor,
  changeDoc: (changeFn: ChangeFn<Page>) => void,
  repo: Repo,
  setHash: (newHash: string) => void
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertNewPageBlock(editor, changeDoc, repo, setHash),
];

export default getCustomSlashMenuItems;
