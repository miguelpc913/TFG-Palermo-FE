import { post } from "./post";

type data<T> = {
  data: Partial<T>;
  endpoint: string;
};

export async function postQuery<T>({ endpoint, data }: data<T>) {
  return post(
    `${import.meta.env.VITE_API_BASE_URL}/${endpoint}`,
    data
  ) as Promise<T>;
}
