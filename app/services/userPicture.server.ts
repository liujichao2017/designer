import { prisma } from "~/services/database.server";

export default () => ({
  getByFolderId: async (folderId: any) => {
    return await prisma.user_picture.findFirst({
      where: {
        folder_id: folderId
      }
    })
  }
})