import { prisma } from "~/services/database.server";

export default () => {
  return {
    getPicturePublicTagList: async () => {
      const result = await prisma.picture_public_tag.findMany({
        select: {
          id: true,
          name: true
        }
      })
      return result
    }
  }
}