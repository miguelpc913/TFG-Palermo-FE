import { AutomergeUrl } from "@automerge/react/slim";
import { Block } from "@blocknote/core";

export type Page = {
  blocks: Block[];
  parent?: AutomergeUrl;
  children: AutomergeUrl[];
};
