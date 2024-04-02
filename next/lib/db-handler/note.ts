import { prismadb } from '.'

const create = async (data: any) => {
  const note = await prismadb.tNote.create({
    data,
  })

  return note
}

const isExist = async (name: string) => {
  const note = await prismadb.tNote.findFirst({
    where: { name },
  })

  return !!note
}

export const noteHandler = { create, isExist }