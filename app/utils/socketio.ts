import { useCallback, useEffect, useState, createContext } from 'react';
import { io, Socket } from 'socket.io-client';

type Opts = {
  endPoint: string
}

type Profile = { id: number, name?: string, email?: string, avatar?: string }
type Message = { content: string, type: string, from?: number, io: string, ts: number, profile?: Profile }
type Invitation = { io: string, id: number, profile?: Profile }
type Room = Map<string, Message[]>

//@ts-ignore
export const ChatContext = createContext<ReturnType<typeof useSocketio>>(null)

export const userCache = new Map<number, Profile>()
// io => owner profile
export const roomCache = new Map<string, Profile>()

export function useSocketio ({ endPoint }: Opts) {

  const [conn, setConn] = useState<Socket>()

  const [roomMessages, setRoomMessages] = useState<Room>(new Map())
  const [connected, setConnected] = useState(conn?.connected)
  const [currentRoom, setCurrentRoom] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const socket = io(endPoint)
    setConn(socket)
    socket.connect()
    const onConnect = () => {
      console.log("connected to " + endPoint)
      setConnected(true)
    }

    const onDisconnect = () => {
      console.log("disconnect from " + endPoint)
      setConnected(false)
    }

    const onError = (err: Error) => {
      console.error(err)
    }

    const onInvite = (data: Invitation) => {
      console.log("on invite ", data)
      setRoomMessages(prev => {
        const next = new Map(prev)
        next.set(data.io, [])
        return next
      })
      setOpen(true)
      setCurrentRoom(data.io)
      data.profile && roomCache.set(data.io, data.profile)
      data.profile && userCache.set(data.id, data.profile)
      socket.emit("join", data, ({ code }: { code: number }) => {
        console.log("join reply", code)
      })
    }

    const onChat = (data: Message) => {
      console.log("chat message ", data)
      data.profile && data.from && userCache.set(data.from, data.profile)
      // data.profile && roomCache.set(data.io, data.profile)
      setRoomMessages(prev => {
        const next = new Map(prev)
        const oldly = next.get(data.io)
        const newly = oldly ? [...oldly, data] : [data]
        next.set(data.io, newly.sort((a, b) => a.ts - b.ts))
        console.log(newly.sort((a, b) => a.ts - b.ts).map(val => val.content))
        return next
      })

      setOpen(true)
    }

    const onGreeting = (s: string) => {
      console.log(s)
    }

    const onJoin = (id: number, io: string) => {
      console.log("user join ", id, io)
    }

    console.log(socket, endPoint)

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("invite", onInvite)
    socket.on("chat", onChat)
    socket.on("error", onError)

    socket.on("greeting", onGreeting)
    socket.on("invite", onInvite)
    socket.on("join", onJoin)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("invite", onInvite)
      socket.off("chat", onChat)

      socket.off("greeting", onGreeting)
      socket.off("invite", onInvite)
      socket.off("join", onJoin)


      socket.disconnect()
    }
  }, [])

  return {
    socket: conn,
    roomMessages,
    connected,
    currentRoom,
    changeRoom: setCurrentRoom,

    //ui controller
    open,
    setOpen,

    //cache
    userCache,
    roomCache,

    login: useCallback((userId: number, profile: Profile) => {
      conn?.emit("login", userId, profile, ({ code, io }: { code: number, io: string }) => {
        console.log(code, io)
        setCurrentRoom(io)
        setRoomMessages(prev => {
          prev.set(io, [])
          return prev
        })
        roomCache.set(io, profile)
      })
      userCache.set(userId, profile)
    }, [conn]),

    join: useCallback((id: string, io: string) => {
      conn?.emit("join", { id, io }, ({ code }: { code: number }) => {
        console.log("join reply ", code)
      })
    }, []),

    invite: useCallback((id: number) => {
      conn?.emit("invite", id, ({ code }: { code: number }) => {
        console.log("invite reply", code)
      })
    }, [conn]),

    send: useCallback((io: string, content: string, type: string) => {
      conn?.emit("chat", { io, content, type }, ({ code }: { code: number }) => {
        console.log("chat reply", code)
      })
    }, [conn]),

  }
}
