import 'dotenv/config'
import http from 'http'
import app from './app'
import { initSocket } from './sockets/socket'
import { prisma } from './config/db'

const server = http.createServer(app)
initSocket(server)

const PORT = Number(process.env.PORT) || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API docs: http://localhost:${PORT}/api/docs`)
  console.log(`Health: http://localhost:${PORT}/api/v1/health`)
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close()
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})
