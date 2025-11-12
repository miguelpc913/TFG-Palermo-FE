import objectHasProperty from "../utils/objectHasProperty";
import { errorHandlerForReactQuery } from "./errorHandlerForReactQuery";

const get = async (url: string, headers?: RequestInit["headers"], withCredentials = true) => {
  const response = await fetch(url, {
    credentials: withCredentials ? "include" : "omit",
    headers,
  });
  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedResponse: any;
    try {
      parsedResponse = await response?.json();
    } catch {
      throw new Error(`Error code ${response.status}`);
    }
    if (objectHasProperty(parsedResponse, "message")) {
      throw new Error(parsedResponse.message);
    } else {
      throw new Error(`Error code ${response.status}`);
    }
  }
  return response;
};

export async function getRequest<T>(
  url: string,
  headers?: RequestInit["headers"],
  withCredentials = true
) {
  try {
    const response = await get(url, headers, withCredentials);
    const parsedResponse = await response?.json();
    return JSON.parse(parsedResponse) as T;
  } catch (e) {
    errorHandlerForReactQuery(e);
  }
}

export async function getRequestNoJSON(
  url: string,
  headers?: RequestInit["headers"],
  withCredentials = true
) {
  try {
    return await get(url, headers, withCredentials);
  } catch (e) {
    errorHandlerForReactQuery(e);
  }
}
