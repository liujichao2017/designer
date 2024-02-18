import { prisma, redis } from "~/services/database.server";
import { cryptoPassword } from "~/utils/crypto.server";
import { useService } from "~/services/services.server";
import { Roles, UserProps } from "~/utils/store";
import { z } from "zod";
import { ChangeUserValidator } from "~/utils/validators";

const pageCount = 18

export default () => {
  return {
    getAdminList: async (page: number = 1, s?: string, roles: number[] = []) => {
      const condition = {
        ...(s ? { OR: [{ email: { contains: s } }, { name: { contains: s } }] } : {}),
        ...(roles.length > 0 ? { roles: { some: { role: { id: { in: roles } } } } } : {})
      }
      const total = await prisma.user.count({ where: condition })
      return {
        users: await prisma.user.findMany({
          where: condition,
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            score: true,
            status: true,
            login_at: true,
            prime: true,
            roles: {
              select: {
                role: true
              }
            },
            profile: {
              select: { description: true, phone: true, language: true, country: true, state: true }
            }
          },
          take: pageCount,
          skip: (page - 1) * pageCount,
          orderBy: { id: "desc" }
        }),
        pages: Math.ceil(total / pageCount)
      }
    },
    getAdminTotalPages: async (take: number) => {
      const count = await prisma.user.count();
      const totalPages = Math.ceil(count / take)
      return totalPages
    },
    updateAdminUser: async (data: z.infer<typeof ChangeUserValidator>, user: UserProps) => {
      const primeService = useService('prime')
      const userRoleService = useService('userRole')
      const roleService = useService('role')
      const userId: number = parseInt(data.id)
      let options = {
        name: data.name,
        email: data.email,
        score: data.score
      }
      if (data.password) {
        options.password = cryptoPassword(data.password)
      }
      const prime = await primeService.getPrimeByUid(userId)
      if (prime) {
        await primeService.updatePrime(prime.id, parseInt(data.prime))
      } else {
        await primeService.insertPrime(userId, parseInt(data.prime))
      }
      await userRoleService.deleteByUid(userId)
      if (data.isPro != 'false') {
        const proId = await roleService.getProId()
        await userRoleService.insertUserRole(userId, proId, 0)
      }
      if (data.isBackAdmin != 'false') {
        const backAdminId = await roleService.getBackAdminId()
        await userRoleService.insertUserRole(userId, backAdminId, 0)
      }
      if (data.isTag != 'false') {
        const tagId = await roleService.getTagId()
        await userRoleService.insertUserRole(userId, tagId, 0)
      }
      if (data.isConsumer != 'false') {
        const role = await prisma.role.findFirst({
          where: { name: Roles.CONSUMER }
        })
        if (role)
          await userRoleService.insertUserRole(userId, role?.id, 0)
      }
      await redis.del(`user::${userId}::roles`)
      await prisma.user.update({
        where: { id: userId },
        data: options
      })
      return null
    },
    getUser: async (id: number) => {
      const user = await prisma.user.findFirst({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          score: true,
          prime: true,
          avatar: true,
          roles: {
            select: {
              role: true
            }
          }
        }
      })
      return user
    },
    lockAdminUser: async (id: number, status: number) => {
      const result = await prisma.user.update({
        where: { id },
        data: { status }
      })
      return result
    },
    deleteAdminUser: async (id: number) => {
      return await prisma.$executeRaw`DELETE FROM user WHERE id=${id}`
    },
    getUserByEmail: async (email: string) => {
      const result = await prisma.user.findFirst({
        where: { email }
      })
      return result
    },

    insertUser: async (email: string, password: string, status = 1, roles: string[] = []) => {
      const rs = roles ?
        await prisma.role.findMany({ where: { name: { in: roles } } }) :
        []
      const user = await prisma.user.create({
        data: {
          email, password: cryptoPassword(password), status,
          profile: {}
        }
      })

      if (rs) {
        await prisma.user_role.createMany({
          data: rs.map(v => ({
            rid: v.id,
            uid: user.id
          }))
        })
      }
    },

    getSearchList: async (keyword: string) => {
      if (!keyword) return []
      const list = await prisma.user.findMany({
        select: {
          id: true,
          avatar: true,
          name: true
        },
        where: {
          OR: [{
            name: {
              contains: keyword
            }
          }, {
            email: {
              contains: keyword
            }
          }]
        }
      })
      return list
    }
  }
}