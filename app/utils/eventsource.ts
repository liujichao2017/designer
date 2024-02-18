import { useEffect, useState } from "react"
import { fetchEventSource } from '@microsoft/fetch-event-source'

type FetchEventSourceOption = {
  event: string,
  method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH" | "OPTION"
  headers: Record<string, string>
  body: string
}

/**
 * Subscribe to an event source and return the latest event.
 * @param url The URL of the event source to connect to
 * @param options The options to pass to the EventSource constructor
 * @returns The last event received from the server
 */
export const useEventSourceExt = (
  url: string,
  init: Partial<FetchEventSourceOption> = {
    event: "default", method: "GET", headers: {
      "Content-Type": "text/event-stream"
    }
  }
) => {
  const [data, setData] = useState<string | null>(null);
  let ctrl = new AbortController();

  useEffect(() => {
    (async () => {
      fetchEventSource(url, {
        ...init,
        onmessage (ev) {
          if (ev.event === init.event) {
            setData(ev.data)
          }
        },
        onclose () {
          console.log("Eventstream closed")
          throw "close"
        },
        onerror (err) {
          console.error("Eventstream error", err)
          throw err
        },
        signal: ctrl.signal
      })
    })()

  }, [url, init])


  useEffect(() => {
    console.log(ctrl.signal.aborted)
  }, [ctrl.signal])

  return { data, ctrl }
}