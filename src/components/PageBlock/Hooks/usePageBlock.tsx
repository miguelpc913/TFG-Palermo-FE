import { Page } from "@/types/Document";
import { AutomergeUrl, useRepo } from "@automerge/react";
import { useEffect, useState } from "react";
import { useHash } from "react-use";

type Props = { link: AutomergeUrl };

export default function usePageBlock({ link }: Props) {
  const [doc, setDoc] = useState<Page | null>(null);
  const repo = useRepo();

  useEffect(() => {
    const findPage = async () => {
      const handle = await repo.find(link);
      const page = await handle.doc();
      setDoc(page);
    };

    if (doc === null) {
      findPage();
    }
  }, []);

  const [_, setHash] = useHash();
  let firstBlockOfDoc = doc?.blocks?.[0];
  const headingText =
    firstBlockOfDoc?.type === "heading" && firstBlockOfDoc?.content?.[0]?.text
      ? firstBlockOfDoc?.content?.[0]?.text
      : "Untitled page";
  const onClickHandler = () => {
    setHash(link);
  };
  return { headingText, onClickHandler };
}
