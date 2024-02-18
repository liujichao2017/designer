import "dotenv/config"
import http from "node:http"
import fastify from "fastify"
import ioserver from "./server.js"

let server
const serverFactory = (handler, opts) => {
  server = http.createServer((req, res) => {
    handler(req, res)
  })

  return server
}

const app = fastify({ serverFactory })
app.get("/", (req, reply) => {
  reply.send({ greeting: "Welcome to definer" })
})


app.ready(() => {
  ioserver(server)
  const port = process.env.PORT ? Number(process.env.PORT) : 3333
  console.log("Start io server on " + port)
  server.listen(port)
})


process.on("uncaughtException", err => {
  console.error(err)
})
