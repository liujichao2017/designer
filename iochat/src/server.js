import { Server } from "socket.io"
import { createAdapter } from "@socket.io/cluster-adapter"
import { setupWorker } from "@socket.io/sticky"
import { instrument } from "@socket.io/admin-ui"
import manager from "./clients.js"


const Result = {
  ok: 0,
  offline: 1
}

const emptyReply = () => { }

export default (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "https://socket-test-client.netlify.app",
        "https://admin.socket.io",
        "http://localhost:3000",
        "http://user.definertech.coim",
        "https://go.definertech.com",
        "https://v2test.definertech.com"],
      credentials: false
    }
  })

  const ns = io.of("/io")
  const ma = manager(io, ns)

  if (process.env.NODE_ENV === "production") {
    console.log("Installing cluster")
    io.adapter(createAdapter())
    setupWorker(io)
  }


  ns.on("connection", socket => {
    socket.emit("greeting", "Welcome to definer chat " + socket.id)
    // console.log(`${socket.conn.remoteAddress} connected`)

    socket.on("invite", (id, reply = emptyReply) => {
      const sockets = ma.fetchSockets(id)
      if (!sockets) {
        return reply({ code: Result.offline })
      }
      sockets.forEach(s => {
        const peer = ns.sockets.get(s)
        if (peer) {
          peer.emit("invite", { io: socket.id, id: socket.data.user, profile: socket.data.profile })
          return reply({ code: Result.ok })
        }
      });

      reply({ code: Result.offline })
    })

    socket.on("join", ({ id, io }, reply = emptyReply) => {
      // console.log("join ,", id, io)
      socket.join(io)
      socket.to(io).emit("join", id, io)
      reply({ code: Result.ok })
    })

    socket.on("login", (id, profile = null, reply = emptyReply) => {
      //todo token login
      socket.data.user = id
      socket.data.profile = profile
      ma.add(id, socket.id)
      socket.join(socket.id)
      ma.joinVirtual(socket.id, socket)
      // console.log(ma.toString())
      reply({ code: Result.ok, io: socket.id })
    })

    socket.on("chat", ({ io, content, type }, reply = emptyReply) => {
      // console.log("chat", io, content)
      ns.to(io).emit("chat", { from: socket.data.user, content, io, type, ts: Date.now(), profile: socket.data.profile })
      reply({ code: Result.ok })
    })

    socket.on("logout", (id, reply = emptyReply) => {
      ma.delete(id)
      socket.data.user = null
      reply({ code: Result.ok })
    })

    socket.on("all", content => {
      ns.emit("all", content)
      socket.broadcast.emit("all", content)
    })

    socket.on("private", content => {
      socket.emit("private", content)
    })

    socket.on("disconnect", (reason) => {
      //todo notify other 
      ma.delete(socket.data.id, socket.id)
      ma.leaveVirtual(socket.id)
    })
  })

  instrument(io, {
    auth: false,
  })
}
