import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../middleware/authenticate'

let io: SocketServer

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  })

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Unauthorized'))
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      socket.data.userId = payload.sub
      socket.data.role = payload.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data
    socket.join(`user:${userId}`)
    socket.join(`role:${role}`)

    socket.on('join:request', (requestId: string) => {
      socket.join(`request:${requestId}`)
    })

    socket.on('leave:request', (requestId: string) => {
      socket.leave(`request:${requestId}`)
    })
  })

  return io
}

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.IO not initialized')
  return io
}

export const emitToUser = (userId: string, event: string, data: unknown) => {
  try {
    getIO().to(`user:${userId}`).emit(event, data)
  } catch {}
}

export const emitToRole = (role: string, event: string, data: unknown) => {
  try {
    getIO().to(`role:${role}`).emit(event, data)
  } catch {}
}

export const emitToRequest = (requestId: string, event: string, data: unknown) => {
  try {
    getIO().to(`request:${requestId}`).emit(event, data)
  } catch {}
}
