import { useCallback, useEffect, useState, useRef } from "react";
import { useAppearanceState } from "./store";
import Nprogress from 'nprogress';
import { useFetcher, useNavigation } from "@remix-run/react";
import { useInterval } from "usehooks-ts";
import type { FetcherWithComponents, SubmitFunction } from "@remix-run/react"
import type { SerializeFrom } from "@remix-run/server-runtime";
import { ResultCode } from "./result";

export function useThemeListener () {
  const changeTheme = useAppearanceState(state => state.changeTheme)
  const [theme, setTheme] = useState("")
  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener("change", (e) => {
      const theme = e.matches ? "dark" : "light"
      changeTheme(theme)
      setTheme(theme)
    })
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener("change", () => { })
    }
  }, [])
  return theme
}

Nprogress.configure({
  template: `<div class="bar text-primary bg-primary" role="bar"><div class="peg"></div>`
})
export function useProgress () {
  const { state } = useNavigation()
  useEffect(() => {
    if (state === "loading" || state === "submitting") {
      Nprogress.start()
    } else if (state === "idle") {
      Nprogress.done()
    }
  }, [state])
}

export function useUnreadNotifies () {
  const [count, setCount] = useState(0)
  const load = useCallback(() => {
    fetch("/api/notify?loader=indicator")
      .then(res => res.json())
      .then(data => {
        if (data.code === ResultCode.OK) {
          setCount(data.count)
        }
      })
      .catch(console.error)
  }, [])
  useInterval(() => {
    load()
  }, 18000)

  useEffect(() => {
    load()
  }, [])
  return count
}

export const validShortcutKey = [
  "shift",
  "alt",
  "meta",
  "ctrl"
] as const

export function useShortcutKeys<T extends typeof validShortcutKey[number]> (compositionKeys: T[]) {
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      setShortcutKey(compositionKeys.map(val =>
        (val === "shift" && event.shiftKey) ||
        (val === "alt" && event.altKey) ||
        (val === "meta" && event.metaKey) ||
        (val === "ctrl" && event.ctrlKey)
      ).every(it => it))
    }
    const keyup = (_: KeyboardEvent) => {
      setShortcutKey(false)
    }
    document.onselectstart = () => false
    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)
    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
      document.onselectstart = () => true
    }
  }, [])
  const [shortcutKey, setShortcutKey] = useState(false)
  return shortcutKey
}

export class Deferred<T = unknown> {
  private _promise: Promise<T>
  public resolve!: (value: T | PromiseLike<T>) => void
  public reject!: (reason?: unknown) => void
  public get promise (): Promise<T> {
    return this._promise
  }
  public constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    });
    Object.freeze(this)
  }
}

type PromisifiedSubmitFunction<TData = unknown> = (
  ...args: Parameters<SubmitFunction>
) => Promise<TData>

type FetcherWithPromisifiedSubmit<TData = unknown> = Omit<
  FetcherWithComponents<TData>,
  "submit"
> & { submit: PromisifiedSubmitFunction<TData> }

export function useFetcherWithPromise<
  TData = unknown,
> (): FetcherWithPromisifiedSubmit<SerializeFrom<TData>> {
  const fetcher = useFetcher<TData>();
  const deferredRef = useRef<Deferred<SerializeFrom<TData>>>();

  const submit: FetcherWithPromisifiedSubmit<SerializeFrom<TData>>["submit"] = (
    ...args
  ) => {
    deferredRef.current = new Deferred()
    fetcher.submit(...args)
    return deferredRef.current.promise
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.type === "done") {
      deferredRef.current?.resolve(fetcher.data);
      deferredRef.current = undefined;
    }
  }, [fetcher.type, fetcher.state, fetcher.data]);

  return { ...fetcher, submit }
}
