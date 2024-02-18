import { z } from "zod";
import { DemandValidator } from "~/utils/validators";
import { prisma, redis } from "./database.server";
import { Roles, UserProps } from "~/utils/store";
import { ResultCode } from "~/utils/result";
import { DemandStatus } from "./status.server";
import { uploadFile, uploadImageContent } from "../services/aws.server";
import { getFileType } from '@/utils/helpers';
import { PayOf } from "~/utils/definition";
import { getDesignersByPictures, getQuotationLevelPlain, getQuotationPlain } from "./logic.server";
import { TimelineStatus, DemandStatus as Demand_Status } from '@/utils/definition'

const pageCount = 15
export default ({ user, locale }: { user?: UserProps, locale?: string }) => ({
  createDemand: async (demand: z.infer<typeof DemandValidator> & {
    link: string
  }) => {
    let role = await prisma.role.findFirst({ where: { name: Roles.CONSUMER } })
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: Roles.CONSUMER
        }
      })
    }
    let consumer = await prisma.user.findFirst({ where: { email: demand.email } })
    if (!consumer) {
      consumer = await prisma.user.create({
        data: { email: demand.email, name: demand.name }
      })
    }
    const relation = await prisma.user_role.findFirst({ where: { uid: consumer.id, rid: role.id } })
    if (!relation) {
      await prisma.user_role.create({
        data: { uid: consumer.id, rid: role.id }
      })
    }

    await redis.del(`user::${consumer.id}::roles`)
    if (demand.type === 3) {
      const designer = await prisma.user.findFirst({
        where: { email: "hobbyland.designer@gmail.com" },
        select: { id: true }
      })
      if (designer) {
        demand.designer_user_id = designer.id
      }
    }
    if (demand.from_designer_flag != 'y') {
      demand.level = await getQuotationLevelPlain(JSON.parse(demand.picture_id ?? "[]"))
      return await prisma.demand.create({
        data: { ...demand, user_id: consumer.id }
      })
    }
    else {
      return await prisma.demand.create({
        data: { ...demand, user_id: consumer.id, status: DemandStatus.obligation }
      })
    }
  },

  addDesignerAddition: async (id: number, addition: string) => {
    const demand = await prisma.demand.findUnique({ where: { id }, select: { email: true, designer_user_id: true } })
    if (demand?.designer_user_id !== user?.id) return
    return await prisma.demand.update({
      where: { id },
      data: {
        designer_addition: addition
      }
    })
  },

  getDemandByHash: async (hash: string) => {
    return await prisma.demand.findFirst({
      where: { link: hash }
    })
  },

  getDemand: async (id: number) => {
    return await prisma.demand.findFirst({
      where: { id },
      include: {
        demand_pay: true,
      }
    })
  },

  getDemandPayments: async (id: number) => {
    return await prisma.demand_pay_order.findMany({
      where: { demand_id: id }
    })
  },

  getQuotationLevel: async (demand: z.infer<typeof DemandValidator> & {
    id: number, quotation?: number, quotation_pdf?: string
  }) => {
    const ids = JSON.parse(demand.picture_id ?? "[]") as number[]
    return getQuotationLevelPlain(ids)
  },

  getQuotations: (demand: z.infer<typeof DemandValidator> & {
    id: number, quotation?: number, quotation_pdf?: string
  }, level: number = 4, plain = false) => {

    if (demand.quotation && demand.quotation > 0) {
      const quotation = +demand.quotation
      const price = demand.page ? quotation / demand.page : quotation
      return {
        totalPrice: quotation, price, pages: demand.page ?? 0,
        discount: demand.discount ?? 0, pdf: demand.quotation_pdf ?? "",
        ...([1, 2].includes(demand.services) ? { printPrice: 0 } : {})
      }
    }
    if (demand.type === null || demand.type === undefined) return
    if (!plain) return

    const data = getQuotationPlain(demand.type, demand.page ?? 0, demand.size ?? -1, level, demand.services ?? 0, demand.suite ?? 0)
    //@ts-ignore
    if (!data.pdf && data.totalPrice) {
      return { ...data, pdf: `${process.env.END_POINT}/quotation/pdf/${demand.id}` }
    }
    return data
  },

  getQuotationPlain,
  getQuotationLevelPlain,

  addQuotation: async (id: number, quotation: number = 0, pdf: string = "", discount = 0) => {
    const pdfUrl = pdf ? (await uploadImageContent(pdf)).Location : ""
    const data = {
      ...(quotation > 0 ? { quotation, order_price: quotation, status: DemandStatus.obligation } : {}),
      ...(pdf ? { quotation_pdf: pdfUrl } : {}),
      ...(discount ? { discount } : {})
    }
    try {
      await prisma.demand.update({
        where: { id },
        data
      })
      return { code: ResultCode.OK }
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR }
    }
  },

  getDemandList: async (page: number = 1) => {
    const total = await prisma.demand.count({})
    const demands = await prisma.demand.findMany({
      take: pageCount,
      skip: (page - 1) * pageCount,
      orderBy: {
        id: 'desc'
      },
      include: {
        designer: true
      }
    })
    return { pages: Math.ceil(total / pageCount), demands }
  },

  rejectJob: async (demandId: number, designerId: number) => {
    const demand = await prisma.demand.findUnique({ where: { id: demandId }, select: { picture_id: true, id: true, designer_user_id: true } })
    if (!demand || demand.designer_user_id !== designerId) return
    const dr = await prisma.demand_rejected_designer.findFirst({ where: { demand_id: demandId, user_id: designerId } })
    if (dr) {
      return dr
    }
    await prisma.demand_rejected_designer.create({
      data: {
        demand_id: demandId,
        user_id: designerId
      }
    })

    const picturesId = JSON.parse(demand?.picture_id ?? "[]")
    const designer = (await getDesignersByPictures(picturesId, demandId)).at(0)
    if (designer) {
      await prisma.demand.update({
        where: { id: demandId },
        data: {
          designer_user_id: designer.id,
          updated_at: new Date(),
        }
      })
    } else {
      await prisma.demand.update({
        where: { id: demandId },
        data: {
          designer_user_id: null,
          status: DemandStatus.pending,
          updated_at: new Date(),
        }
      })
    }
    return designer
  },

  getAdminTotalPages: async (take: number) => {
    const count = await prisma.demand.count();
    const totalPages = Math.ceil(count / take)
    return totalPages
  },
  deleteDemand: async (id: number) => {
    const result = await prisma.demand.delete({
      where: { id }
    })
    return result
  },
  updateDesignerUserId: async (id: number, designerUserId: number) => {
    await prisma.demand.update({
      where: { id },
      data: {
        designer_user_id: designerUserId,
        //        status: 3,
      }
    })
  },
  createAttachments: async (name: string, link: string, demand_id: number) => {
    return await prisma.attachment.create({
      data: {
        name,
        link,
        demand_id,
        source_from: 1
      }
    })
  },
  createEmpAttachments: async (name: string, link: string, demand_id: number) => {
    return await prisma.attachment.create({
      data: {
        name,
        link,
        demand_id,
        source_from: 0,
      }
    })
  },
  updateAttachments: async (id: number, name: string, link: string) => {
    return await prisma.attachment.update({
      where: {
        id,
      },
      data: {
        name,
        link,
      }
    })
  },
  delAttachment: async (id: number) => {
    return await prisma.attachment.delete({
      where: { id }
    })
  },
  getAttachments: async (demand_id: number) => {
    return await prisma.attachment.findMany({
      where: { demand_id }
    })
  },
  getDemandAttachments: async (id: number) => {
    return await prisma.demand.findFirst({
      where: { id },
      include: {
        attachments: true,
        finished_pictures: true,
        demand_comment: {
          where: {
            status: 0
          },
          select: {
            id: true,
          }
        },
        project: {
          select: {
            id: true, books: {
              include: {
                pages: { where: { page: 1 }, select: { litpic_url: true } },
              }
            }
          },
        },
      }
    })
  },
  updateCommentStatus: async (demandId: number, status: number) => {
    return await prisma.demand_comment.updateMany({
      data: {
        status,
      },
      where: {
        demand_id: demandId,
      }
    })
  },
  getEvaluateComments: async (id: number) => {
    return await prisma.demand_comment.findMany({
      where: { demand_id: id },
      include: {
        designer: true,
      }
    })
  },
  getDemandDesign: async (id: number) => {
    return await prisma.demand.findFirst({
      where: { id },
      include: {
        project: {
          select: {
            id: true, books: {
              include: {
                marks: true,
                pages: { where: { page: 1 }, select: { litpic_url: true, } },
              }
            }
          },
        },
        attachments: true,
        empfile_list: true,
      }
    })
  },
  updataTimelineStatus: async (id: number, status: number, draft_delivery_time?: Date, full_delivery_time?: string, isfinished?: boolean) => {
    return await prisma.demand.update({
      where: { id },
      data: {
        timeline_status: status,
        ...full_delivery_time ? { full_delivery_time } : {},
        ...draft_delivery_time ? { draft_delivery_time } : {},
        // ...isfinished ? { status: 7 } : {},
      }
    })
  },
  delEmpAttachment: async (id: number) => {
    return await prisma.empfile_list.delete({
      where: { id }
    })
  },
  uploadEmployerFiles: async (files: any[], demand_id: number) => {
    const results = await Promise.all(files.map((file) => {
      return uploadFile(file.src, file.name, file.type)
    }))
    await prisma.empfile_list.createMany({
      data: results.map((file, index) => {
        return {
          file_name: file.Key.split("|")?.[1],
          file_url: file.Location,
          demand_id,
          type: getFileType(files?.[index]),
        }
      })
    })
  },

  uploadPaymentSnap: async (id: number, snap: string, amount: number, payType: PayOf) => {
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: { demand_pay: true }
    })

    // const status = demand?.demand_pay.length ? DemandStatus.pendingWithPartPay : DemandStatus.pendingWithPay

    const payments = await prisma.demand_pay.findMany({ where: { demand_id: id } })

    const paid = payments.map(val => val.pay_price?.toNumber()).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0
    if (paid >= (demand?.quotation?.toNumber() ?? 0)) {
      // amount = 0
    }
    const { Location } = await uploadImageContent(snap)
    await prisma.demand.update({
      where: { id },
      data: {
        status: DemandStatus.unreception,
      }
    })
    await prisma.demand_pay.create({
      data: {
        pay_image: Location,
        pay_type: payType,
        pay_price: amount,
        demand_id: id,
      }
    })
  },
  // 获取超过12小时后已接受的订单，但是未开始设计
  getOver12hAcceptedDemand: async () => {
    return await prisma.demand.findMany({
      where: {
        status: Demand_Status.progressing,
        timeline_status: {
          in: [TimelineStatus.INIT, TimelineStatus.EMPLOYCONFIRMED]
        },
        updated_at: {
          lt: new Date(new Date().getTime() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
        }
      },
      include: {
        designer: true,
      }
    })
  },
  // 获取还有x小时过期的订单
  getleftxhNotAcceptDemand: async (hours: number) => {
    const xHoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000); // x小时前的时间
    return await prisma.demand.findMany({
      where: {
        status: Demand_Status.unreception,
        updated_at: {
          gte: xHoursAgo.toISOString(), // 大于等于2小时前的时间
          lt: new Date().toISOString(),   // 小于当前时间
        }
      },
      include: {
        designer: true,
      }
    })
  },
  // 超过2个小时还未接受的订单，将自动分配
  getleft2hNotAcceptTopendingDemand: async (hours: number = 2) => {
    const xHoursAgo = new Date();
    xHoursAgo.setHours(xHoursAgo.getHours() - hours);
    const recordsToUpdate = await prisma.demand.findMany({
      where: {
        status: Demand_Status.unreception,
        updated_at: {
          lt: new Date(new Date().getTime() - hours * 60 * 60 * 1000).toISOString(), // 小于2小时前的时间
        }
      },
      include: {
        designer: true,
      }
    })
    // await prisma.demand.updateMany({
    //   where: {
    //     updated_at: {
    //       lt: new Date(new Date().getTime() - hours * 60 * 60 * 1000).toISOString(), // 小于2小时前的时间
    //     },
    //   },
    //   data: {
    //     status: DemandStatus.pending, // 设置状态为2000
    //     designer_user_id: null,
    //     updated_at: new Date()
    //   },
    // })
    return recordsToUpdate;
  },
  // 获取距离结束时间不足x小时的已接受的订单，但还未完成
  getOverXhNotEndDemand: async (hours: number) => {
    const now = new Date();
    // 计算当前时间加上48小时的时间点
    const hours48FromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return await prisma.demand.findMany({
      where: {
        status: Demand_Status.progressing,
        draft_delivery_time: {
          lt: hours48FromNow.toISOString(), // x hours ago
          gte: now.toISOString(), // 大于或等于当前时间
        }
      },
      include: {
        designer: true,
      }
    })
  },
  // 获取终稿结束时间不足x小时的已接受的订单，但还未完成
  getOverXhNotFinalDemand: async (hours: number) => {
    const now = new Date();
    // 计算当前时间加上48小时的时间点
    const hours48FromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return await prisma.demand.findMany({
      where: {
        status: Demand_Status.progressing,
        final_delivery_time: {
          lt: hours48FromNow.toISOString(), // x hours ago
          gte: now.toISOString(), // 大于或等于当前时间
        }
      },
      include: {
        designer: true,
      }
    })
  },
})
