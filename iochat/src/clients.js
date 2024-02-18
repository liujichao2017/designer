import _ from "lodash"

export default (io, ns) => {
  //uid => [socketid]
  const mapper = new Map()
  //socketid => uid
  const reverse = new Map()

  const group = new Map()

  const users = new Map()

  return {
    add: (id, socketId) => {
      const sockets = mapper.get(id)
      reverse.set(socketId, id)
      mapper.set(id, sockets ? [...sockets, socketId] : [socketId])
    },

    remove: (id, socketId) => {
      const sockets = mapper.get(id)
      reverse.delete(socketId)
      sockets && mapper.set(id, socks.filter(val => val !== socketId))
    },

    delete: (id) => {
      const sockets = mapper.get(id)
      for (const socket of sockets)
        reverse.delete(socket)
      return mapper.delete(id)
    },

    clear: () => apper.clear(),

    fetchSockets: id => mapper.get(id),
    fetchId: socketId => reverse.get(socketId),


    joinVirtual: (room, user) => {
      const members = group.get(room)
      group.set(room, members ? [...members, user] : [user])
      if (user.io)
        user.io.join(room)
    },

    leaveVirtual: (room, user) => {
      const members = group.get(room)
      members && group.set(room, socks.filter(val => val !== socketId))
      const socket = ns.sockets.get(socket)
      socket.leave(room)
    },

    getOfflines: async (room) => {
      const sockets = io.in(room).fetchSockets()
      const virtual = group.get(room)
      return _.xor(sockets, virtual)
    },

    toString: () => {
      return [mapper.toString(), reverse.toString(), group.toString()].join("\n")
    },
  }
}