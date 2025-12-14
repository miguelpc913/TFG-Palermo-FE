import { AutomergeUrl } from "@automerge/react";

type MyJwtPayload = {
  sub?: string;
  exp?: number;
  iat?: number;
  email?: string;
  rootDocUrl?: AutomergeUrl;
};

function getJwtPayload(): MyJwtPayload {
  const token = localStorage.getItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
  if (token) {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payloadJson);
  } else {
    return {};
  }
}

export default getJwtPayload;
