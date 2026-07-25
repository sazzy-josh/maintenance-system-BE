export const generateReference = (): string => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
  return `REQ-${year}-${random}`
}
