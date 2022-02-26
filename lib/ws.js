import { v4 as uuidv4 } from 'uuid'
import handlers from './handlers.js'
import {
  SIGNAL_ID,
  SIGNAL_USERS
} from './events.js'

const WEBSOCKET_OPEN = 1

class WsServer {
  constructor () {
    this.wss = null
    this.clients = null
    this.scaner = null
    this.TIMEOUT = 2000
  }

  serve (wss) {
    this.wss = wss
    this.clients = wss.clients

    wss.on('connection', ws => {
      this._onConnection(ws)
    })

    wss.on('close', () => {
      clearInterval(this.scaner)
    })

    this._scanerStart()
  }

  _scanerStart () {
    this.scaner = setInterval(() => {
      if (this.clients.size > 0) {
        this.clients.forEach(ws => {
          if (!ws.isAlive) {
            ws.terminate()
          } else {
            ws.isAlive = false
            ws.ping()
          }
        })
      }
    }, this.TIMEOUT)
  }
  
  _send (id, msg) {
    this.clients.forEach(ws => {
      if (ws.id === id) {
        ws.send(JSON.stringify(msg))
      }
    })
  }

  _boardcast (data) {
    this.clients.forEach(ws => {
      ws.send(JSON.stringify(data))
    })
  }

  _onConnection (ws) {
    ws.id = uuidv4()
    ws.isAlive = true

    ws.send(JSON.stringify({ event: SIGNAL_ID, data: { uid: ws.id } }))

    const users = this._getUserList()
    this._boardcast({ event: SIGNAL_USERS, data: { users } })

    ws.on('message', msg => {
      const { event, data } = JSON.parse(msg)
      handlers[event]?.call(this, ws, data)
    })

    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('close', () => {
      const users = this._getUserList()
      this._boardcast({ event: SIGNAL_USERS, data: { users } })
    })
  }

  _getUserList () {
    return [...this.clients].filter(ws => ws.readyState === WEBSOCKET_OPEN).map(ws => ws.id)
  }
}

export default WsServer