import { QueryKey } from "@tanstack/react-query";
import objectHasProperty from "../utils/objectHasProperty";

export const buildUrlFromQueryKey = (queryKey: QueryKey) => {
  const urlFilter: string[] = [];
  const urlPath: (string | number)[] = [];
  queryKey.forEach(query => {
    if (typeof query === "string" || typeof query === "number") {
      urlPath.push(query);
    } else if (typeof query === "object" && !Array.isArray(query)) {
      for (const key in query) {
        if (objectHasProperty(query, key)) {
          urlFilter.push(`${encodeURI(key)}=${encodeURI(query[key as keyof typeof query])}`);
        }
      }
    }
  });

  return {
    queryParams: urlFilter.length > 0 ? `?${urlFilter.join("&")}` : "",
    endpoint: urlPath.join("/"),
  };
};
