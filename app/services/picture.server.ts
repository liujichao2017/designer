//@ts-nocheck
import _ from "lodash"
import { UserProps, isRole, Roles } from "~/utils/store"
import { prisma } from "./database.server"
import { ResultCode } from "~/utils/result"
import { uploadImages } from "~/utils/upload.server"
import { groupBy } from "~/utils/helpers"
import { getQuotationLevelPlain } from "~/services/logic.server"

export enum PictureStatus {
  ALL = -1,
  ACCEPTED = 0,
  REJECTED = 1,
  PENDING = 2
}

export enum ImportStatus {
  SUSPENSE = 0,
  IMPORTED = 1,
  REJECTED = 2,
  PENDING = 3
}

const pageCount = 30

const recommentByPictureCount = 3


export default ({ user }: {
  user: UserProps
}) => {
  return {
    getDesignerPublicPictures: async (page: number = 1, status: number = -1) => {
      const condition = { ...(status !== -1 ? { status } : {}), user_id: user.id }
      const count = await prisma.picture.count({ where: condition })
      const pictures = await prisma.picture.findMany({
        where: condition,
        orderBy: { id: "desc" },
        take: pageCount,
        skip: (page - 1) * pageCount
      })
      return {
        pages: Math.ceil(count / pageCount) || 1
        , pictures
      }
    },

    getPublicPictures: async (page: number, status: PictureStatus) => {
      const statusFilter = status === -1 ? {} : { status }
      const count = await prisma.picture.count({
        where: statusFilter
      })
      return {
        pictures: await prisma.picture.findMany({
          where: { ...statusFilter },
          select: {
            id: true, litpic_url: true, img_url: true, created_at: true, project_name: true, level: true,
            tag: {
              select: { id: true, name: true }
            },
            tags: {
              select: { id: true, name: true, zh: true, cht: true }
            },
            owner: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { id: "desc" },
          take: pageCount,
          skip: (page - 1) * pageCount,
        }),
        count
      }
    },
    getPublicPicturesByDemand: async (category?: number, level?: number) => {
      const where = {
        ...(category === -1 ? {} : category === 0 ? { tags: { none: {} } } : { tags: { some: { id: category } } }),
        ...(level < 0 ? {} : { level }),
      }
      return await prisma.picture.findMany({
        orderBy: {
          level: 'desc'
        },
        where,
        take: 200,
        select: {
          id: true,
          litpic_url: true,
          img_url: true,
          created_at: true,
          project_name: true,
          level: true,
          tags: true,
        },
      })
    },
    getPublicPicturesByCategory: async (category: string = "") => {
      const condition = {
        status: PictureStatus.ACCEPTED,
        ...(!category ? { tags: { none: {} } } : { tags: { some: { prefix: "category", name: category + "" } } }),
      }
      return await prisma.picture.findMany({
        where: condition,
        take: pageCount * 2,
        orderBy: { id: "desc" },
        select: {
          id: true, litpic_url: true, img_url: true, created_at: true, project_name: true, level: true,
        }
      })
    },
    getCategorys: async () => {
      return await prisma.picture_public_tag.findMany({ select: { id: true, name: true }, orderBy: { id: "asc" } })
    },

    getTags: async () => {
      const tags = await prisma.tag.findMany({ select: { id: true, name: true, zh: true, cht: true, prefix: true }, orderBy: { id: "asc" } })
      const group = groupBy(tags,
        val => val.prefix ?? ""
      )
      // return [group, [...tags, { id: -2, name: "未分类" }]]
      // return tags
      return group
    },

    getNamedLevel: async () => {
      return await prisma.level.findMany({ select: { id: true, name: true }, orderBy: { id: "asc" } })
    },

    addTag: async (prefix: string, name: string, cht?: string, zh?: string) => {
      try {
        await prisma.tag.create({ data: { prefix, name, cht, zh } })
        return { code: ResultCode.OK }
      } catch (e) {
        return { code: ResultCode.FORM_INVALID }
      }
    },

    removeTag: async (id: number) => {
      await prisma.tag.delete({ where: { id } })
      return { code: ResultCode.OK }
    },

    renameTag: async (id: number, name: string, cht?: string, zh?: string) => {
      await prisma.tag.update({ where: { id }, data: { name, cht, zh } })
      return { code: ResultCode.OK }
    },

    bindTag: async (ids: number[], tagId: number) => {
      try {
        for (let id of ids) {
          await prisma.picture.update({
            where: { id },
            data: {
              tags: {
                connect: { id: tagId }
              }
            }
          })
        }
        return { code: ResultCode.OK }
      } catch (err) {
        return { code: ResultCode.DATABASE_ERROR }
      }
    },

    unbindTag: async (ids: number[], tagId: number) => {
      try {
        for (let id of ids) {
          await prisma.picture.update({
            where: { id },
            data: {
              tags: {
                disconnect: { id: tagId }
              }
            }
          })
        }
        return { code: ResultCode.OK }
      } catch (err) {
        return { code: ResultCode.DATABASE_ERROR }
      }
    },

    bindCategory: async (ids: number[], categoryId: number) => {
      try {
        await prisma.picture.updateMany({
          where: { id: { in: ids } },
          data: {
            picture_public_tag_id: categoryId
          }
        })
        return { code: ResultCode.OK }
      } catch (err) {
        return { code: ResultCode.DATABASE_ERROR }
      }
    },

    bindLevel: async (ids: number[], level: number) => {
      try {
        await prisma.picture.updateMany({
          where: { id: { in: ids } },
          data: { level }
        })
        return { code: ResultCode.OK }
      } catch (err) {
        return { code: ResultCode.DATABASE_ERROR }
      }
    },

    getPictureByFilter: async (page: number, category: number[] = [-1], organization: number[] = [-1], purpose: number[] = [-1], level: number[] = [-1]) => {
      const condition = {
        status: PictureStatus.ACCEPTED,
        ...(level[0] === -2 ? { level: 0 } : (level[0] >= 0 ? { level: { in: level } } : {})),

        ...(purpose[0] === -2 ? { tags: { none: { prefix: "purpose" } } } :
          purpose[0] === -1 ? {} :
            purpose.length ? { tags: { some: { id: { in: purpose } } } } : {}),

        ...(organization[0] === -2 ? { tags: { none: { prefix: "organization" } } } :
          organization[0] === -1 ? {} :
            organization.length ? { tags: { some: { id: { in: organization } } } } : {}),

        ...(category[0] === -2 ? { tags: { none: { prefix: "category" } } } :
          category[0] === -1 ? {} :
            category.length ? { tags: { some: { id: { in: category } } } } : {})
      }
      const total = await prisma.picture.count({ where: condition })
      return {
        pictures: await prisma.picture.findMany({
          where: condition,
          take: pageCount,
          skip: (page - 1) * pageCount,
          orderBy: { id: "desc" },
          select: {
            id: true, litpic_url: true, img_url: true, created_at: true, project_name: true, level: true,
            tag: {
              select: { id: true, name: true }
            },
            tags: {
              select: { id: true, name: true, zh: true, cht: true, prefix: true }
            },
            owner: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }),
        pages: Math.ceil(total / pageCount)
      }
    },

    getDesignerByPicture: async (ids: number[], demandId?: number) => {
      const rejectedDesigner = demandId ?
        (await prisma.demand_rejected_designer.findMany({ where: { demand_id: demandId }, select: { user_id: true } })).map(val => val.user_id) :
        [];
      const designersData = await prisma.user.findMany({
        where: {
          id: { notIn: rejectedDesigner },
          pictures: { some: { id: { in: ids } } },
          roles: { some: { role: { name: Roles.PRO } } }
        },
        select: { id: true, name: true, avatar: true, email: true, pictures: { select: { id: true } } }
      })

      const scoresCfg = [50, 35, 25, 20, 15]
      let designers = designersData.map((d) => {
        const score = ids.map((id, index) => {
          return (d.pictures.find(val => val.id === id)) ? (scoresCfg.at(index) ?? 0) : 0
        }).reduce((a, b) => a + b, 0)
        return { ...d, __score: score }
      }).sort((a, b) => {
        if (a.__score > b.__score) return -1
        if (a.__score < b.__score) return 1
        return 0
      })

      const level = await getQuotationLevelPlain(ids)


      if (designers.length < recommentByPictureCount) {
        for (const [_i, id] of ids.entries()) {
          const picture = await prisma.picture.findFirst({
            where: { id },
            select: {
              tags: {
                where: { "prefix": "category" },
                select: {
                  id: true, name: true
                }
              },
              id: true,
              level: true
            }
          })

          const relation = await prisma.user.findMany({
            where: {
              id: { notIn: rejectedDesigner },
              roles: { some: { role: { name: Roles.PRO } } },
              pictures: { some: { level: picture?.level ?? 0 } }
            },
            select: { id: true, name: true, avatar: true, email: true, pictures: { select: { id: true } } },
            take: 3,
            orderBy: { score: "desc" }
          })
          designers = _.unionBy([...designers, ...(relation.map(val => ({ ...val, score: -1 })))], "id")
          if (designers.length >= recommentByPictureCount) {
            return designers.slice(0, recommentByPictureCount)
          }
        }
      }
      if (designers.length < recommentByPictureCount) {
        const recomments = await prisma.user.findMany({
          where: { id: { notIn: designers.map(d => d.id) }, roles: { some: { role: { name: Roles.PRO } } } },
          select: { id: true, name: true, avatar: true, email: true },
          orderBy: { score: "desc" },
          take: pageCount / 10
        })
        return [...designers, ...recomments.slice(0, recommentByPictureCount - designers.length)]
      }
      return designers.slice(0, recommentByPictureCount)
    },

    getRecommendDisigner: async (demand_id: number, pictures: number[]) => {

    },

    getDesignerByIds: async (ids: number[]) => {
      return await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, avatar: true, email: true, portfolios: { take: 6 }, profile: true }
      })
    },

    removePictures: async (pictures: number[]) => {
      if (!pictures.length) return { code: ResultCode.FORM_INVALID }
      await prisma.picture.deleteMany({ where: { id: { in: pictures } } })
      return { code: ResultCode.OK }
    },

    getPrivatePictures: async () => {
      return await prisma.user_picture.findMany({
        where: { user_id: user.id },
        orderBy: { id: "desc" },
      })
    },

    getPortfolioPictures: async () => {
      return await prisma.portfolio.findMany({
        where: { uid: user.id },
        orderBy: { id: "desc" },
      })
    },

    removePrivatePicture: async (id: number) => {
      if (isRole(user, Roles.BACK_ADMIN)) {
        await prisma.user_picture.delete({ where: { id } })
        return { code: ResultCode.OK }
      }
      await prisma.user_picture.delete({ where: { id, user_id: user.id } })
      return { code: ResultCode.OK }
    },

    removePortfolioPicture: async (id: number) => {
      if (isRole(user, Roles.BACK_ADMIN)) {
        await prisma.portfolio.delete({ where: { id } })
        return { code: ResultCode.OK }
      }
      await prisma.portfolio.delete({ where: { id, uid: user.id } })
      return { code: ResultCode.OK }
    },

    uploadPictures: async (contents: string[]) => {
      const images = await uploadImages(contents)
      if (!images) return { code: ResultCode.AWS_ERROR }
      await Promise.all(images.map(({ url, thumbnailUrl }) =>
        prisma.picture.create({
          data: { user_id: user.id, litpic_url: thumbnailUrl, img_url: url, status: PictureStatus.PENDING }
        })
      ))
      return { code: ResultCode.OK }
    },

    uploadPicturesByAdmin: async (contents: string[]) => {
      const images = await uploadImages(contents)
      if (!images) return { code: ResultCode.AWS_ERROR }
      await Promise.all(images.map(({ url, thumbnailUrl }) =>
        prisma.picture.create({
          data: { user_id: user.id, litpic_url: thumbnailUrl, img_url: url, status: PictureStatus.ACCEPTED }
        })
      ))
      return { code: ResultCode.OK }
    },

    importFromPrivate: async (ids: number[]) => {
      const pictures = await Promise.all(ids.map(id => prisma.user_picture.update({
        where: { id, user_id: user.id },
        data: { import_status: ImportStatus.PENDING }
      })))
      await prisma.picture.createMany({
        data: pictures.map(val => ({
          user_id: user.id, litpic_url: val.litpic_url ?? "", img_url: val.img_url ?? "", status: PictureStatus.PENDING
        }))
      })
      return { code: ResultCode.OK }
    },

    importFromPortfolio: async (ids: number[]) => {
      const portfolio = await Promise.all(ids.map(id => prisma.portfolio.update({
        where: { id, uid: user.id },
        data: { import_status: ImportStatus.PENDING }
      })))
      await prisma.picture.createMany({
        data: portfolio.map(val => ({
          user_id: user.id, litpic_url: val.thumbnail_url ?? val.img_url ?? "", img_url: val.img_url ?? "", status: PictureStatus.PENDING
        }))
      })
      return { code: ResultCode.OK }
    },

    getAuditPictureList: async () => {
      const result = await prisma.picture.findMany({
        where: {
          status: PictureStatus.PENDING
        },
        select: {
          id: true,
          user_id: true,
          litpic_url: true,
          owner: {
            select: {
              id: true,
              avatar: true,
              name: true,
              profile: {
                select: { description: true, language: true, phone: true, country: true, state: true }
              }
            }
          },
          tag: {
            select: {
              name: true
            }
          }
        }
      })
      return result
    },

    passPicture: async (ids: string, picturePublicTagId: number, level: number) => {
      const idsList = ids.split(',')
      for (const value of idsList) {
        const obj = {
          where: {
            id: parseInt(value)
          },
          data: { level, status: PictureStatus.ACCEPTED }
        }
        if (picturePublicTagId > 0) {
          obj.data.picture_public_tag_id = picturePublicTagId
        }
        await prisma.picture.update(obj)
      }
    },

    rejectPicture: async (ids: string) => {
      await prisma.picture.updateMany({
        where: { id: { in: ids.split(",").map(v => +v) } },
        data: { status: PictureStatus.REJECTED }
      })
      // const idsList = ids.split(',')
      // for (const value of idsList) {
      //   await prisma.picture.update({
      //     where: {
      //       id: parseInt(value)
      //     },
      //     data: {
      //       status: PictureStatus.REJECTED
      //     }
      //   })
      // }
    },
    getPictureListByIds: async (ids: string) => {
      ids = ids.replace('[', '')
      ids = ids.replace(']', '')
      if (!ids) return []
      let list = []
      for (let i = 0; i < ids.split(',').length; i++) {
        const picture = await prisma.picture.findFirst({
          where: {
            id: parseInt(ids.split(',')[i])
          }
        })
        list.push({
          litpic_url: picture?.litpic_url,
          img_url: picture?.img_url
        })
      }
      return list
    }
  }
}
