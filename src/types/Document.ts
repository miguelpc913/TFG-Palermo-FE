import { AutomergeUrl } from "@automerge/react";

export type Page = {
  richText: string;
  parent?: AutomergeUrl;
  children: AutomergeUrl[];
};
