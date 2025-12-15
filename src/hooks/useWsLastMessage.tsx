import { useContext, useSyncExternalStore } from "react";
import { WsContext } from "@/providers/WsProvider";
import { FromServerMessage } from "@/ws/messages";

export function useWsLastMessage(): FromServerMessage | null {
  const { ws } = useContext(WsContext);

  return useSyncExternalStore(
    ws ? ws.subscribe : () => () => {},
    ws ? ws.getSnapshot : () => null,
    ws ? ws.getServerSnapshot : () => null
  );
}
