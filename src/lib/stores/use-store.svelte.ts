import type { ReadableAtom } from "nanostores";

export function useStore<T>(atom: ReadableAtom<T>): T {
  let value = $state<T>(atom.get());

  $effect(() => {
    return atom.subscribe((v) => {
      value = v;
    });
  });

  return value;
}
