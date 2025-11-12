import { patch } from "./patch";

type data<T> = {
  data: Partial<T>;
  endpoint: string;
};

export async function patchQuery<T>({ endpoint, data }: data<T>) {
  return patch(
    `${import.meta.env.VITE_API_BASE_URL}/${endpoint}`,
    data
  ) as Promise<T>;
}
