import { Page } from "@/Types/Document";
import { AutomergeUrl, Repo } from "@automerge/react";

const ROOT_DOC_URL_KEY = "root-doc-url-4";

export const setRootDocUrl = (url: AutomergeUrl): void => {
  localStorage.setItem(ROOT_DOC_URL_KEY, url);
};

export const getOrCreateRoot = (repo: Repo): AutomergeUrl => {
  // Check if we already have a root document
  const existingId = localStorage.getItem(ROOT_DOC_URL_KEY);
  if (existingId) {
    return existingId as AutomergeUrl;
  }

  // Otherwise create one and (synchronously) store it
  const root = repo.create<Page>({ blocks: [{}] });
  localStorage.setItem(ROOT_DOC_URL_KEY, root.url);
  return root.url;
};
