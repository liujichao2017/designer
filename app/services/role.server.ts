import { UserProps } from "~/utils/store"
import { prisma } from "~/services/database.server";

export default ({ user }: {
  user: UserProps
}) => {
  const roles = {
    superAdmin: "superAdmin",
    backAdmin: "backAdmin",
    pro: "pro",
    tag: 'tag',
    consumer: "consumer"
  }
  return {
    getValidRoles: () => [...new Set(Object.values(roles))],

    getRolesId: async (roles: string[]) => {
      return await prisma.role.findMany({
        where: { name: { in: roles } }
      })
    },

    isValidRole: (name: string) => {
      return Object.values(roles).includes(name)
    },
    getProId: async () => {
      const result = await prisma.role.findFirst({
        where: {
          name: roles.pro
        }
      })
      let id: number = result ? result.id : 0
      if (id <= 0) {
        const createResult = await prisma.role.create({
          data: {
            name: roles.pro,
            status: 1
          }
        })
        id = createResult.id
      }
      return id
    },
    getBackAdminId: async () => {
      const result = await prisma.role.findFirst({
        where: {
          name: roles.backAdmin
        }
      })
      let id: number = result ? result.id : 0
      if (id <= 0) {
        const createResult = await prisma.role.create({
          data: {
            name: roles.backAdmin,
            status: 1
          }
        })
        id = createResult.id
      }
      return id
    },
    getTagId: async () => {
      const result = await prisma.role.findFirst({
        where: {
          name: roles.tag
        }
      })
      let id: number = result ? result.id : 0
      if (id <= 0) {
        const createResult = await prisma.role.create({
          data: {
            name: roles.tag,
            status: 1
          }
        })
        id = createResult.id
      }
      return id
    }
  }
}