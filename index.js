import Koa from 'koa'
import WebSocket from 'ws'
import WsServer from './lib/ws.js'

const app = new Koa()
const server = new WsServer()

const port = process.argv?.[2] || '3883'

server.serve(
  new WebSocket.Server({
    server: app.listen(port, '0.0.0.0')
  })
)
