import {
  SIGNAL_CALL,
  SIGNAL_ANSWER,
  SIGNAL_RTC_DESCRIPTION,
  SIGNAL_RTC_ANSWER,
  SIGNAL_RTC_ICECANDIDATE
} from './events.js'

const handlers = {
  'signal-call': function (ws, data) {
    const { uid, state } = data
    this._send(uid, { event: SIGNAL_CALL, data: { uid: ws.id, state } })
  },

  'signal-answer': function (ws, data) {
    const { uid, state } = data
    this._send(uid, { event: SIGNAL_ANSWER, data: { uid: ws.id, state } })
  },

  'signal-rtc-description': function (ws, data) {
    const { uid, description } = data
    this._send(uid, { event: SIGNAL_RTC_DESCRIPTION, data: { uid: ws.id, description } })
  },

  'signal-rtc-answer': function (ws, data) {
    const { uid, answer } = data
    this._send(uid, { event: SIGNAL_RTC_ANSWER, data: { uid: ws.id, answer } })    
  },

  'signal-rtc-icecandidate': function (ws, data) {
    const { uid, candidate } = data
    this._send(uid, { event: SIGNAL_RTC_ICECANDIDATE, data: { uid: ws.id, candidate } })
  }
}

export default handlers