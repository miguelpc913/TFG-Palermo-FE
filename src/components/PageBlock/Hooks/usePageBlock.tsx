import {
  AMSpan,
  spansToBlockNoteBlocks,
} from "@/components/Editor/Utils/blocknoteAutomergeIntegration";
import { Page } from "@/types/Document";
import { AutomergeUrl, useRepo } from "@automerge/react";
import { Block } from "@blocknote/core";
import { useEffect, useState } from "react";
import { useHash } from "react-use";
import * as Automerge from "@automerge/automerge";

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
  const spans = doc?.richText ? (Automerge.spans(doc as any, ["richText"]) as AMSpan[]) : [];
  const docBlocks = spansToBlockNoteBlocks(spans);
  let firstBlockOfDoc = docBlocks?.[0];
  const headingText =
    firstBlockOfDoc?.type === "heading" && firstBlockOfDoc?.content?.[0]?.text
      ? firstBlockOfDoc?.content?.[0]?.text
      : "Untitled page";
  const onClickHandler = () => {
    setHash(link);
  };
  return { headingText, onClickHandler };
}
