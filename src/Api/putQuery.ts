import { putRequestNoJson } from "./put";

export type data<T> = {
  data: Partial<T>;
  endpoint: string;
};

export async function putQuery<T>({ endpoint, data }: data<T>) {
  return putRequestNoJson(
    `${import.meta.env.VITE_API_BASE_URL}/${endpoint}`,
    data
  ) as Promise<T>;
}
