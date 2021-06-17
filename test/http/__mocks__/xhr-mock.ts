const open = jest.fn()
const setRequestHeader = jest.fn()
const send = jest.fn()
const addEventListener = jest.fn()
const abort = jest.fn()

Object.defineProperty(window, 'XMLHttpRequest', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    open: open,
    send: send,
    setRequestHeader: setRequestHeader,
    addEventListener: addEventListener,
    abort: abort,
    readyState: 4,
    status: 200
  }))
})

export {
  open,
  send,
  setRequestHeader,
  addEventListener,
  abort
}
