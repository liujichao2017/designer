import { Roles, UserProps } from "~/utils/store";
import { prisma, redis } from "./database.server";
import { PictureStatus } from "~/utils/definition";

export enum NotifyStatus {
  STATUS_UNREAD = 0,
  STATUS_READED = 1
}

export enum NotifyType {
  TYPE_APPLY_FOR_PRO = 1,
  TYPE_REJCT_FOR_PRO = 2,
  TYPE_BECOME_PRO = 4,
  TYPE_SEND_OFFER = 3,
  TYPE_COMMON_NOTIFY = 0,
  TYPE_REJECT = 5,
  TYPE_ACCEPT_DEMAND = 6,
  TYPE_REJECT_DEMAND = 7
}

const notifiesCount = 5

export default ({ user }: {
  user: UserProps
}) => {
  if (!user) throw "Current user is required."
  return {
    applyDesigner: async () => {
      const admins = await prisma.user_role.findMany({
        where: {
          role: { name: Roles.BACK_ADMIN }
        }
      })
      const data = { from: user.id, status: NotifyStatus.STATUS_UNREAD, type: NotifyType.TYPE_APPLY_FOR_PRO }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          applies: {
            create: {
              type: NotifyType.TYPE_APPLY_FOR_PRO
            }
          }
        }
      })
      // const request = await prisma.apply.findFirst({
      //   where: { uid: user.id, type: NotifyType.TYPE_APPLY_FOR_PRO },
      //   select: { id: true }
      // })
      // if (!request) prisma.apply.create({
      //   data: {
      //     uid: user.id,
      //     type: NotifyType.TYPE_APPLY_FOR_PRO
      //   }
      // })
      return await prisma.notify.createMany({
        data: admins.map(admin => ({
          ...data,
          to: admin.uid
        }))
      })
    },

    rejectJob: async (demandId: number, reason: string = "") => {
      const admins = await prisma.user_role.findMany({
        where: {
          role: { name: Roles.BACK_ADMIN }
        }
      })
      const data = { from: user.id, status: NotifyStatus.STATUS_UNREAD, type: NotifyType.TYPE_REJECT_DEMAND }
      const content = { demandId }
      return await prisma.notify.createMany({
        data: admins.map(admin => ({
          ...data,
          to: admin.uid,
          title: reason,
          content: JSON.stringify(content)
        }))
      })
    },

    getApplyDesigner: async () => {
      return await prisma.apply.findFirst({
        where: { uid: user.id }
      })
    },

    getNotifies: async (last: number = -1) => {
      const where = last > 0 ? { id: { lt: last }, to: user.id } : { to: user.id }
      return await prisma.notify.findMany({
        where: { ...where },
        orderBy: { id: "desc" },
        take: notifiesCount,
        select: {
          id: true, title: true, content: true, type: true, created_at: true, status: true,
          owner: { select: { id: true, name: true, avatar: true, email: true } },
          sender: { select: { id: true, name: true, avatar: true, email: true } }
        }
      })
    },

    getUnread: async (last: number = -1) => {
      const where = last > 0 ?
        { id: { lt: last }, status: NotifyStatus.STATUS_UNREAD, to: user.id } :
        { status: NotifyStatus.STATUS_UNREAD, to: user.id }
      return await prisma.notify.findMany({
        where: { ...where },
        orderBy: { id: "desc" },
        take: notifiesCount,
        select: {
          id: true, title: true, content: true, type: true, created_at: true, status: true,
          owner: { select: { id: true, name: true, avatar: true, email: true } },
          sender: { select: { id: true, name: true, avatar: true, email: true } }
        }
      })
    },

    markAllReaded: async () => {
      return await prisma.notify.updateMany({
        where: { to: user.id },
        data: { status: NotifyStatus.STATUS_READED }
      })
    },

    markReaded: async (id: number) => {
      return await prisma.notify.update({
        where: { id, to: user.id },
        data: { status: NotifyStatus.STATUS_READED }
      })
    },

    remove: async (id: number) => {
      return await prisma.notify.delete({ where: { id, to: user.id } })
    },

    hasUnread: async () => {
      try {
        return await prisma.notify.count({
          where: { status: NotifyStatus.STATUS_UNREAD, to: user.id },
        })
      } catch (err) {
        return 0
      }
    },

    removeApply: async () => {
      return await prisma.apply.deleteMany({
        where: { uid: user.id, type: NotifyType.TYPE_APPLY_FOR_PRO }
      })
    },

    getApplyProRequests: async () => {
      return await prisma.apply.findMany({
        where: { type: NotifyType.TYPE_APPLY_FOR_PRO },
        select: {
          id: true, title: true, content: true, type: true, created_at: true, status: true,
          from: { select: { id: true, name: true, avatar: true } },
        }
      })
    },

    rejectPro: async (id: number, reason: string = "") => {
      return await prisma.notify.create({
        data: {
          type: NotifyType.TYPE_REJCT_FOR_PRO,
          from: user.id,
          to: id,
          title: reason
        }
      })
    },

    approvePro: async (id: number) => {
      const role = await prisma.role.findFirst({ where: { name: Roles.PRO } })
      if (!role) return
      const relation = await prisma.user_role.findFirst({ where: { uid: id, rid: role?.id } })
      if (relation) return
      await redis.del(`user::${id}::roles`)
      await prisma.user_role.create({
        data: {
          rid: role.id,
          uid: id
        }
      })
      const portfolio = await prisma.portfolio.findMany({
        where: { uid: id }
      })

      for (let p of portfolio) {
        const old = await prisma.picture.findFirst({ where: { img_url: p.img_url }, select: { id: true } })
        if (!old)
          await prisma.picture.create({
            data: {
              user_id: id,
              img_url: p.img_url ?? "",
              litpic_url: p.thumbnail_url ?? "",
              status: PictureStatus.PENDING,
            }
          })
      }
      // await prisma.picture.createMany({
      //   data: portfolio.map(val => ({
      //     user_id: id,
      //     img_url: val.img_url ?? "",
      //     litpic_url: val.thumbnail_url ?? "",
      //     status: 2,
      //   }))
      // })
      return await prisma.notify.create({
        data: {
          type: NotifyType.TYPE_BECOME_PRO,
          from: user.id,
          to: id,
        }
      })
    },

    getNotifyList: async (from: number) => {
      let where = {
        type: NotifyType.TYPE_APPLY_FOR_PRO,
        ...(from ? { from } : {})
      }
      const result = await prisma.notify.findMany({
        where,
        select: {
          id: true,
          from: true,
          to: true,
          type: true,
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          }
        }
      })
      return result
    },
    deleteProNotify: async (id: number) => {
      const result = await prisma.notify.deleteMany({
        where: { to: id, type: NotifyType.TYPE_APPLY_FOR_PRO }
      })
      return result
    },
    acceptDemondByDesign: async (id: number | undefined, to: number, title: string) => {
      return await prisma.notify.create({
        data: {
          type: NotifyType.TYPE_ACCEPT_DEMAND,
          from: id,
          to: to,
          title: title,
        }
      })
    }
  }
}