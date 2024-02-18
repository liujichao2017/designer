import { UserProps } from "~/utils/store";
import { prisma } from "./database.server";
import { uploadImageContent } from "./aws.server";
import { ResultCode } from "~/utils/result";
import { cryptoPassword } from "~/utils/crypto.server";
import { uploadImages } from "~/utils/upload.server";
import { PictureStatus } from "~/utils/definition";

export default ({ user }: { user: UserProps }) => ({
  getProfileById: async (id: number) => {
    return await prisma.user.findFirst({
      where: { id },
      select: {
        id: true, name: true, email: true, avatar: true,
        skills: {
          select: { skill: true }
        },
        profile: true,
        portfolios: true,
        experiences: true,
        demand_comment: {
          take: 100,
          include: {
            demand: {
              select: {
                name: true,
              }
            }
          }
        },
      }
    })
  },
  getProfile: async () => {
    return await prisma.user.findFirst({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, avatar: true,
        skills: {
          select: { skill: true }
        },
        profile: true,
        portfolios: true,
        experiences: true,
        demand_comment: {
          take: 10,
          include: {
            demand: {
              select: {
                name: true,
              }
            }
          }
        },
      }
    })
  },

  getSecure: async () => {
    const self = await prisma.user.findFirst({
      where: { id: user.id },
      select: { password: true, auths: true }
    })
    const hasPassword = Boolean(self?.password)
    return { hasPassword, auths: self?.auths }
  },

  changeAvatar: async (content: string) => {
    try {
      const resp = await uploadImageContent(content)
      if (!resp.Location) {
        return { code: ResultCode.AWS_ERROR }
      }
      const profile = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: resp.Location }
      })
      return { code: ResultCode.OK, profile }
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR }
    }
  },


  update: async (name?: string, email?: string, city?: string, country?: string, title?: string, phone?: string, account?: string, bank?: string, language?: number) => {
    try {
      const mutation = { city, country, title, phone, account, bank, language }
      const profile = await prisma.user.update({
        where: { id: user.id },
        data: {
          name, email, profile: {
            upsert: {
              create: { ...mutation }, update: { ...mutation }
            }
          }
        }
      })
      return { code: ResultCode.OK, profile }
    } catch (err) {
      console.log(err)
      return { code: ResultCode.DATABASE_ERROR }
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const self = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } })
      if (self?.password) {
        const updated = await prisma.user.update({
          where: { id: user.id, password: cryptoPassword(oldPassword) },
          data: { password: cryptoPassword(newPassword) }
        })
        if (!updated) {
          return { code: ResultCode.PASSWORD_INCORRECT }
        }
        return { code: ResultCode.OK }
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: cryptoPassword(newPassword) }
        })
        return { code: ResultCode.OK }
      }
    } catch (err) {
      return { code: ResultCode.PASSWORD_INCORRECT }
    }
  },

  getAllProfile: async (id: number = -1) => {
    id = id <= 0 ? user.id : id
    const profile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, avatar: true, profile: true, portfolios: true, experiences: true, skills: {
          select: { skill: true }
        }
      }
    })
    return profile
  },

  uploadPortfolio: async (contents: string[], autoMerge: boolean = true) => {
    const images = await uploadImages(contents)
    if (!images) return { code: ResultCode.AWS_ERROR }
    await Promise.all(images.map(({ url, thumbnailUrl }) => {
      return (async () => {
        await prisma.portfolio.create({
          data: { uid: user.id, thumbnail_url: thumbnailUrl, img_url: url }
        })
        if (autoMerge) {
          await prisma.picture.create({
            data: { user_id: user.id, litpic_url: thumbnailUrl, img_url: url, status: PictureStatus.PENDING }
          })
        }
      })()

    }))
    return { code: ResultCode.OK }
  },

  removePortfolio: async (id: number) => {
    await prisma.portfolio.delete({ where: { id, uid: user.id } })
    return { code: ResultCode.OK }
  },

  addExperience: async (company: string, title: string, description: string, startDate: string, endDate: string, active: boolean, country: string, city: string) => {
    try {
      const experience = await prisma.experience.create({
        data: { company, title, description, start_at: startDate, end_at: endDate, is_working: active, country, city, uid: user.id }
      })
      return { code: ResultCode.OK }
    } catch (err) {
      console.error(err)
      return { code: ResultCode.DATABASE_ERROR }
    }
  },

  removeExperience: async (id: number) => {
    await prisma.experience.delete({ where: { id, uid: user.id } })
    return { code: ResultCode.OK }
  },

  saveBase: async (name: string, description: string, gender: number, phone: string, country: string) => {
    await prisma.user.update({
      where: { id: user.id },
      data: { name }
    })
    const profile = await prisma.profile.findFirst({ where: { uid: user.id }, select: { id: true } })
    if (profile) {
      await prisma.profile.update({
        where: { uid: user.id },
        data: { description, gender, phone, country }
      })
    } else {
      await prisma.profile.create({ data: { uid: user.id, description, gender, phone, country } })
    }
    return { code: ResultCode.OK }
  },

  saveDescription: async (description: string, name: string) => {
    await prisma.user.update({
      where: { id: user.id },
      data: { name }
    })
    await prisma.profile.update({
      where: { uid: user.id },
      data: { description }
    })
    return { code: ResultCode.OK }
  },

  removeSkill: async (id: number) => {
    await prisma.user_skill.delete({
      where: {
        uid_sid: { uid: user.id, sid: id }
      }
    })
    return { code: ResultCode.OK }
  },

  addSkill: async (name: string) => {
    const us = await prisma.user_skill.findMany({ where: { uid: user.id } })
    if (us.length > 24) {
      return { code: ResultCode.UPPER_LIMIT }
    }
    let skill = await prisma.skill.findFirst({ where: { name } })
    if (!skill) {
      skill = await prisma.skill.create({ data: { name } })
    }
    try {
      await prisma.user_skill.create({ data: { uid: user.id, sid: skill?.id } })
    } catch (err) {
      return { code: ResultCode.DUPLICATE_ITEM }
    }
    return { code: ResultCode.OK }
  }
})