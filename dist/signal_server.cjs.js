'use strict';

var Koa = require('koa');
var WebSocket = require('ws');
var uuid = require('uuid');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Koa__default = /*#__PURE__*/_interopDefaultLegacy(Koa);
var WebSocket__default = /*#__PURE__*/_interopDefaultLegacy(WebSocket);

const SIGNAL_ID = 'signal-id';
const SIGNAL_USERS = 'signal-users';

const SIGNAL_CALL = 'signal-call';
const SIGNAL_ANSWER = 'signal-answer';

const SIGNAL_RTC_DESCRIPTION = 'signal-rtc-description';
const SIGNAL_RTC_ANSWER = 'signal-rtc-answer';
const SIGNAL_RTC_ICECANDIDATE = 'signal-rtc-icecandidate';

const handlers = {
  'signal-call': function (ws, data) {
    const { uid, state } = data;
    this._send(uid, { event: SIGNAL_CALL, data: { uid: ws.id, state } });
  },

  'signal-answer': function (ws, data) {
    const { uid, state } = data;
    this._send(uid, { event: SIGNAL_ANSWER, data: { uid: ws.id, state } });
  },

  'signal-rtc-description': function (ws, data) {
    const { uid, description } = data;
    this._send(uid, { event: SIGNAL_RTC_DESCRIPTION, data: { uid: ws.id, description } });
  },

  'signal-rtc-answer': function (ws, data) {
    const { uid, answer } = data;
    this._send(uid, { event: SIGNAL_RTC_ANSWER, data: { uid: ws.id, answer } });    
  },

  'signal-rtc-icecandidate': function (ws, data) {
    const { uid, candidate } = data;
    this._send(uid, { event: SIGNAL_RTC_ICECANDIDATE, data: { uid: ws.id, candidate } });
  }
};

const WEBSOCKET_OPEN = 1;

class WsServer {
  constructor () {
    this.wss = null;
    this.clients = null;
    this.scaner = null;
    this.TIMEOUT = 2000;
  }

  serve (wss) {
    this.wss = wss;
    this.clients = wss.clients;

    wss.on('connection', ws => {
      this._onConnection(ws);
    });

    wss.on('close', () => {
      clearInterval(this.scaner);
    });

    this._scanerStart();
  }

  _scanerStart () {
    this.scaner = setInterval(() => {
      if (this.clients.size > 0) {
        this.clients.forEach(ws => {
          if (!ws.isAlive) {
            ws.terminate();
          } else {
            ws.isAlive = false;
            ws.ping();
          }
        });
      }
    }, this.TIMEOUT);
  }
  
  _send (id, msg) {
    this.clients.forEach(ws => {
      if (ws.id === id) {
        ws.send(JSON.stringify(msg));
      }
    });
  }

  _boardcast (data) {
    this.clients.forEach(ws => {
      ws.send(JSON.stringify(data));
    });
  }

  _onConnection (ws) {
    ws.id = uuid.v4();
    ws.isAlive = true;

    ws.send(JSON.stringify({ event: SIGNAL_ID, data: { uid: ws.id } }));

    const users = this._getUserList();
    this._boardcast({ event: SIGNAL_USERS, data: { users } });

    ws.on('message', msg => {
      const { event, data } = JSON.parse(msg);
      handlers[event]?.call(this, ws, data);
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      const users = this._getUserList();
      this._boardcast({ event: SIGNAL_USERS, data: { users } });
    });
  }

  _getUserList () {
    return [...this.clients].filter(ws => ws.readyState === WEBSOCKET_OPEN).map(ws => ws.id)
  }
}

const app = new Koa__default["default"]();
const server = new WsServer();

const port = process.argv?.[2] || '3883';

server.serve(
  new WebSocket__default["default"].Server({
    server: app.listen(port, '0.0.0.0')
  })
);
