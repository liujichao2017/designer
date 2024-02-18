import { useCallback, useEffect, useRef, useContext } from "react"
import { ChatContext } from "~/utils/socketio"
import { useCurrent } from "~/utils/store"
import Avatar from "../Avatar"
import { Link } from "@remix-run/react"
import { CloseIcon } from "../Icons"

export default function Chat () {
  const {
    roomMessages,
    connected,
    currentRoom,
    changeRoom,
    login,
    send,
    open,
    setOpen,
    userCache,
    roomCache
  } = useContext(ChatContext)

  const user = useCurrent()
  const inputRef = useRef<HTMLInputElement>(null)
  const messageDivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("open change", open)
  }, [open])

  useEffect(() => {
    if (connected && user?.id) {
      login(user?.id, user ?? {})
    }
  }, [connected])

  const sendMessage = useCallback(() => {
    const content = inputRef.current!.value
    if (content) {
      send(currentRoom, content, "text/plain")
      inputRef.current!.value = ""
      inputRef.current!.focus()
    }
  }, [currentRoom])

  useEffect(() => {
    if (messageDivRef.current)
      messageDivRef.current!.scrollTop = messageDivRef.current!.scrollHeight
  }, [roomMessages])

  return (
    open &&
    <div className="flex flex-col gap-2 fixed bottom-5 right-5 w-96 bg-base-100 shadow-lg rounded-lg z-50 py-2">
      <div className="flex px-2 justify-between">
        <div className="tabs">
          {
            Array.from(roomMessages.keys()).map((val) => {
              const owner = roomCache.get(val)
              return currentRoom === val ?
                <a className="tab tab-lifted tab-active" key={val} onClick={_ => changeRoom(val)}>
                  {owner?.id === user?.id ? "我的頻道" : owner?.name?.slice(0, 8)}
                </a> :
                <a className="tab tab-lifted" key={val} onClick={_ => changeRoom(val)}>
                  {owner?.id === user?.id ? "我的頻道" : owner?.name?.slice(0, 8)}
                </a>
            })
          }
        </div>

        <button className="btn btn-ghost btn-sm" onClick={_ => setOpen(false)}>
          <CloseIcon size={4} />
        </button>
      </div>

      <div className="flex flex-col gap-2 h-48 overflow-y-scroll px-2 text-sm" ref={messageDivRef}>
        <div className="flex-1"></div>
        {
          roomMessages.get(currentRoom)?.map(val => {
            const from = userCache.get(val.from ?? 0)
            if (val.from === user?.id) {
              return (
                <div className="flex justify-end w-full" key={val.ts}>
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{val.content}</span>
                    <Link to="/portfolio">
                      <Avatar user={from} size="xs" />
                    </Link>
                  </div>
                </div>
              )
            }
            return (
              <div className="flex w-full" key={val.ts}>
                <div className="flex items-center gap-2 font-semibold">
                  <Link to={"/portfolio/" + user?.id}>
                    <Avatar user={from} size="xs" />
                  </Link>
                  <span>
                    {val.content}
                  </span>
                </div>
              </div>
            )
          })
        }
      </div>

      <div className="px-2">
        <div className="join w-full">
          <input type="text"
            className="input input-sm input-bordered join-item flex-1"
            ref={inputRef}
            onKeyDown={event => {
              if (event.key === "Enter") {
                sendMessage()
              }
            }} />
          <button className="btn btn-primary btn-sm join-item" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div >
  )
}