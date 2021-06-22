import { mocked } from 'ts-jest/utils';
import {Socket} from "../../src/http/socket";
import {Request} from "../../src/http/request";

jest.mock('../../src/http/request', () => {
    return {
        Request: jest.fn()
    }
})

describe('constructor', () => {
    it('initialises', () => {
        expect(new Socket({}, 'foo')).toBeInstanceOf(Socket)
    })
})

describe('connect', () => {
    const request = mocked(Request, true)

    const pollSpy = jest.spyOn(Socket.prototype as any, 'poll');
    pollSpy.mockImplementation(() => {});

    beforeEach(() => {
        request.mockClear()
        pollSpy.mockClear()
    });

    it('sends request', () => {
        const mockSend = jest.fn();
        request.mockImplementation(() : any => {
            return {
                success: jest.fn(function (this: Request, cb) {
                    cb({responseText: '{"status": "success", "time": "1", "id": 1}'})

                    return this
                }),
                send: mockSend
            }
        })

        const token = 'foo', route = '/connect'
        const socket = new Socket({routes: {connect: route}}, token);
        socket.connect()

        expect(request).toHaveBeenCalledWith('POST', route)
        expect(mockSend).toHaveBeenCalledWith({_token: token})
    })

    it('runs success callback', () => {
        request.mockImplementation(() : any => {
            return {
                success: jest.fn(function (this: Request, cb) {
                    cb({responseText: '{"status": "success", "time": "2021-06-22 00:00:00", "id": 1}'})

                    return this
                }),
                send: jest.fn()
            }
        })

        const token = 'foo', route = '/connect'
        const socket = new Socket({routes: {connect: route}}, token);
        socket.connect()

        expect(socket.id).toEqual(1)
        expect(pollSpy).toBeCalledTimes(1)
    })

    it('exits when returns unexpected response', () => {
        request.mockImplementation(() : any => {
            return {
                success: jest.fn(function (this: Request, cb) {
                    cb({responseText: '{}'})

                    return this
                }),
                send: jest.fn()
            }
        })

        const token = 'foo', route = '/connect'
        const socket = new Socket({routes: {connect: route}}, token);
        socket.connect()

        expect(pollSpy).toBeCalledTimes(0)
        expect(socket.id).toEqual('')
    })
})
