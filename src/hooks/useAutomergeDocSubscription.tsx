import { useEffect } from "react";
import { AutomergeUrl, useRepo } from "@automerge/react";
import type { DocHandle } from "@automerge/react";
import {} from "@automerge/react";

export function useAutomergeDocSubscription<Page>(
  docUrl: AutomergeUrl,
  onDoc: (doc: Page) => void
) {
  const repo = useRepo();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const handle: DocHandle<Page> = await repo.find<Page>(docUrl);

      handle.on("change", evt => {
        onDoc(evt.doc);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [repo, docUrl, onDoc]);
}
