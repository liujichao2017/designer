import { z } from "zod";
import { DemandValidator } from "~/utils/validators";
import { prisma, redis } from "./database.server";
import { Roles } from "~/utils/store";
import { ResultCode } from "~/utils/result";
import { uploadImages } from "~/utils/upload.server";
import { uploadImageContent } from "./aws.server";
import { UserProps } from "~/utils/store"
import { encrypto } from "~/utils/crypto.server"

export default ({ user }: { user: UserProps }) => ({
    getSelfEvaluateComments: async (userId: number) => {
        return await prisma.demand_comment.findMany({
          where: { demand: {
            designer_user_id: userId
          }},
          include: {
            designer: true,
            demand: true,
          },
        })
    },
    getDemandListByUser:  async (userId: number, take: number, skip: number, status?: number) => {
      return await prisma.demand.findMany({
        where: { 
          designer_user_id: userId,
            ...status == undefined ? {status: {gte: 3000}} : {status}
         },
        include: {
          project: true,
          
        },
        take,
        skip,
        orderBy: {
          created_at: 'desc'
        }
      })
    },
    getUserEamilByDemandId: async (id: number) => {
      return await prisma.demand.findFirst({
        where:{
          id,
        },
        select: {
          email: true,
        }
      })
    },
    getADemandListByUserTotalPages: async (userId: number, take: number, status?: number) => {
      const count = await prisma.demand.count({
        where: { 
          designer_user_id: userId,
            ...status == undefined ? {status: {gte: 3000}} : {status}
         },
      });
      const totalPages = Math.ceil(count / take)
      return totalPages
    },
    acceptDemand: async (id: number, status: number,project_id?: number, designer_user_id?: number, full_delivery_time?: Date, final_delivery_time?: Date, draft_delivery_time?: Date) => {
      await prisma.demand.update({
        where: { id },
        data: {
          status,
          ...project_id ? {project_id}: {},
          ...final_delivery_time ? {final_delivery_time}: {},
          ...full_delivery_time ? {full_delivery_time}: {},
          ...draft_delivery_time ? {draft_delivery_time}: {},
          updated_at: new Date(),
        }
      })
    },
    rejectDemand: async (id: number, status: number,project_id?: number, designer_user_id?: number) => {
      await prisma.demand.update({
        where: { id },
        data: {
          status,
          ...designer_user_id ? {designer_user_id}: {designer_user_id: null},
        }
      })
    },
    finishedDemand: async (id: number) => {
      await prisma.demand.update({
        where: { id },
        data: {
          status: 7
        }
      })
    },

    getShareLink: async (id: number) => {
      const designer = await prisma.user.findUnique({ where: { id }, select: { id: true } })
      if (!designer) return ""
      const cipher = encrypto({ designerId: id})
      // console.log(process.env.NODE_ENV)
      return process.env.END_POINT + "/demand-requirement/submit/" + cipher
    }
})

