import { prisma } from "~/services/database.server";

export default () => ({
  getList: async () => {
    let list = await prisma.user_picture_folder.findMany()
    return list
  },
  deleteById: async (id: number) => {
    const result = await prisma.user_picture_folder.delete({
      where: {
        id: id
      }
    })
    return result
  }
})