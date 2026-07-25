export const getPagination = (page = 1, limit = 10) => {
  const take = Math.min(Number(limit), 100)
  const skip = (Math.max(Number(page), 1) - 1) * take
  return { skip, take }
}

export const getMeta = (total: number, page: number, limit: number) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  totalPages: Math.ceil(total / limit),
})
