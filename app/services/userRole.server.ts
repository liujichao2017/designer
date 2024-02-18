import { prisma } from "~/services/database.server";
import { assertPipelinePrimaryTopicReference } from "@babel/types";
import { Roles } from "~/utils/store";

export default () => {
  return {
    deleteByUid: async (uid: number) => {
      const result = await prisma.user_role.deleteMany({
        where: {
          uid: uid
        }
      })
      return result
    },
    insertUserRole: async (uid: number, rid: number, level: number) => {
      await prisma.user_role.create({
        data: { uid, rid, level }
      })
    },
    insertProUserRole: async (uid: number, rid: number, level: number) => {
      const row = await prisma.user_role.findFirst({
        where: { uid, rid }
      })
      if (row) {
        await prisma.user_role.update({
          where: {
            id: row.id
          },
          data: { level }
        })
      } else {
        await prisma.user_role.create({
          data: { uid, rid, level }
        })
      }
    },

  }
}