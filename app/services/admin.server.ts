import { Roles, UserProps } from "~/utils/store";
import { prisma } from "./database.server";
import { Prisma } from "@prisma/client";

import Decimal from 'decimal.js';
import { DemandStatus, UserIncomeStatus } from "./status.server";
import dayjs from "dayjs";
import { shuffle } from "lodash";

const pageCount = 15

export default ({ user, roles }: { user: UserProps, roles: string[] }) => {
  const PAGE_COUNT = 20

  return {
    getRecommandDesigners: async () => {
      const pro = await prisma.role.findFirst({ where: { name: Roles.PRO } })
      const ru = await prisma.user_role.findMany({
        where: {
          rid: pro?.id
        },
        select: { user: true },
        take: 20
      })
      return shuffle(ru.map(v => v.user)).slice(0, 10).filter(v => v)
    },

    getUsers: async (lastId: number = 0) => {
      return await prisma.user.findMany({
        where: { id: { gt: lastId } },
        take: PAGE_COUNT
      })
    },

    getProjects: async (lastId: number = 0) => {
      return await prisma.project.findMany({
        select: {
          project_name: true, id: true, created_at: true, updated_at: true,
          owner: {
            select: { name: true, email: true, id: true }
          },
          books: {
            select: {
              pages: { where: { page: 1 }, select: { litpic_url: true } }
            }
          }
        },
        orderBy: { id: "desc" }
      })
    },

    getDemandsByFilter: async (page = 1, status = [], startAt = "", endAt = "", keyword = "") => {
      const where = {
        ...(status ? { status: { in: status } } : {}),
        ...(startAt ? { created_at: { gt: dayjs(startAt).toDate() } } : {}),
        ...(endAt ? { created_at: { lte: dayjs(endAt).toDate() } } : {}),
        ...(keyword ? {
          OR: [
            { OR: [{ name: { contains: keyword } }, { email: { contains: keyword } }] },
            { designer: { OR: [{ name: { contains: keyword } }, { email: { contains: keyword } }] } }
          ]
        } : {})
      }
      const total = await prisma.demand.count({ where })
      return {
        demands: await prisma.demand.findMany({
          where,
          include: {
            designer: true,
          },
          take: pageCount,
          skip: (page - 1) * pageCount,
          orderBy: { id: "desc" },
        }),
        pages: Math.ceil(total / pageCount)
      }
    },


    checkout: async (demandId: number, ratio: number = 0.5) => {
      const demand = await prisma.demand.findUnique({
        where: { id: demandId },
      })
      if (demand?.status !== DemandStatus.completed) {
        // throw "Demand uncompleted"
        return { reason: "Demand uncompleted", demand, income: 0, profit: 0, score: 4.0 }

      }
      if (!demand.designer_user_id) {
        // throw "Invalid designer"
        return { reason: "Invalid designer", demand, income: 0, profit: 0, score: 4.0 }

      }
      const designer = await prisma.user.findUnique({
        where: { id: demand.designer_user_id },
        include: { profile: true }
      })
      if (!designer) {
        // throw "Designer unexsiting"
        return { reason: "Designer unexsiting", demand, income: 0, profit: 0, score: 4.0 }
      }
      try {

        return await prisma.$transaction(async tx => {

          const value = (await tx.demand_pay.findMany({
            where: { demand_id: demandId }
          })).map(it => it.pay_price?.toNumber())
            .filter(it => !!it)
            .reduce((a, b) => Decimal.add(a, b ?? 0), new Decimal(0))

          if (value.equals(new Decimal(0))) {
            throw "no money"
          }

          const income = value.mul(new Decimal(ratio))
          const profit = value.sub(income)

          const incomeEntry = await tx.user_income.create({
            data: {
              amount: income.toNumber(),
              status: UserIncomeStatus.unremit,
              user_id: designer.id,
              demand_id: demand.id
            }
          })

          const profitEntry = await tx.system_profit.create({
            data: {
              profit: profit.toNumber(),
            }
          })

          await tx.demand_pay.updateMany({
            where: { demand_id: demandId },
            data: {
              user_income_id: incomeEntry.id,
              system_profit_id: profitEntry.id
            }
          })

          await tx.demand.update({
            where: { id: demandId },
            data: { status: DemandStatus.settled }
          })

          await tx.profile.update({
            where: { uid: designer.id },
            data: {
              balance: income.add(designer.profile?.balance ?? new Decimal(0))
            }
          })

          return { income: income.toNumber(), profit: profit.toNumber(), demand, reason: "", score: 4.0 }
        }, {
          maxWait: 30000,
          timeout: 25000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        })

      } catch (err) {
        console.error(err)
        return { reason: (err as any).toString(), demand, income: 0, profit: 0, score: 4.0 }
      }
    }
  }
}
