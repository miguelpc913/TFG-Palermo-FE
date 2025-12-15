import { WebSocketAuthAdapter } from "@/ws/WebSocketAuthAdapter";
import { createContext, ReactNode } from "react";

type ContextWs = {
  ws: WebSocketAuthAdapter | null;
};

export const WsContext = createContext({} as ContextWs);

export const WsProvider = ({
  children,
  ws,
}: {
  children: ReactNode;
  ws: WebSocketAuthAdapter | null;
}) => {
  return <WsContext.Provider value={{ ws }}>{children}</WsContext.Provider>;
};
