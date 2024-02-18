import Decimal from "decimal.js";
import { prisma, redis } from "./database.server";
const cleanDeep = require('clean-deep');

export default () => ({
    getOrdersListByUser: async (userId: number, take: number, skip: number, status?: number[], sortitems?: any) => {
        return await prisma.demand.findMany({
            where: {
                designer_user_id: userId,
                ...status ? { status: { in: [...status] } } : {status: {gt: 3000, not: 5000}},
            },
            include: {
                user_income: true,
                demand_comment: true,
                demand_pay: true,
            },
            take,
            skip,
            orderBy: {
                final_delivery_time: 'desc',
                ...sortitems ? {...sortitems}: {}
            }
        })
    },
    getOrdersListByUserTotalPages: async (userId: number, take: number, status?: number[]) => {
        const count = await prisma.demand.count({
            where: {
                designer_user_id: userId,
                ...status ? { status: { in: [...status] } } : {status: {gt: 4000, not: 5000}},
            },
        });
        const totalPages = Math.ceil(count / take)
        return totalPages
    },
    getOrdersByUser: async (userId: number, status?: number[]) => {
        return await prisma.demand.findMany({
            where: {
                designer_user_id: userId,
                ...status ? { status: { in: [...status] } } : {status: {gt: 3000, not: 5000}},
            },
            include: {
                user_income: true,
                demand_comment: true,
                demand_pay: true,
            },
            orderBy: {
                created_at: 'desc'
            }
        })
    },
    getIncomeOrdersListByUser: async (userId: number, take: number, skip: number, status?: number,sortitems?: any) => {
        return await prisma.user_withdraw.findMany({
            where: { user_id: userId, status },
            take,
            skip,
            // orderBy: [
            //     {
            //         created_at: 'desc',
            //         ...sortitems.created_at ? {created_at: sortitems.created_at}: {}
            //     },
            //     {
            //         updated_at: 'desc',
            //         ...sortitems.updated_at ? {updated_at: sortitems.updated_at}: {}
            //     },
            // ],
            orderBy: {
                ...sortitems ? {...sortitems}: {}
            }
        })
    },
    getIncomeOrdersListByUserTotalPages: async (userId: number, take: number, status?: number) => {
        const count = await prisma.user_withdraw.count({
            where: { user_id: userId, status },
        });
        const totalPages = Math.ceil(count / take)
        return totalPages
    },
    getIncomeOrdersByUser: async (userId: number, status?: number) => {
        return await prisma.user_withdraw.findMany({
            where: { user_id: userId, status },
            orderBy: {
                created_at: 'desc'
            }
        })
    },

    getUserBalance: async (userId: number) => {
        const balance = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                profile: true,
            }
        });
        const paddingAmount = await prisma.demand_pay.aggregate({
            _sum: {
                pay_price: true,
            },
            where: {
                demand: {
                    designer_user_id: userId,
                    status: { in: [7000] },
                }
            },
        })

        const progressAmount = await prisma.demand_pay.aggregate({
            _sum: {
                pay_price: true,
            },
            where: {
                demand: {
                    designer_user_id: userId,
                    status: {gt: 3000,lt:8000, not: 5000}
                }
            },
        })

        return cleanDeep({
            balance,
            paddingAmount,
            progressAmount,
        },{emptyArrays: false})
    },

    cashing: async (bank: string, withdraw_type: number, collection_account: string, amount: number, userId?: number, demand_ids: string) => {
        try {
            return await prisma.$transaction(async tx => {
                const profile = await tx.profile.findFirst({
                    where: {
                        uid: userId
                    }
                })
                const balance = profile?.balance?.toNumber() ?? 0
                if (balance < amount) {
                    throw "insufficient balance"
                }

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        profile: { update: { balance: { decrement: amount } } }
                    }
                })
                const ids: number[] = demand_ids.split(",").map((val) => parseInt(val))
                
                await tx.demand.updateMany({
                    where: {id: {in: ids}},
                    data: {
                        status: 9000,
                    }
                })
                return await tx.user_withdraw.create({
                    data: {
                        user_id: userId,
                        withdraw_type,
                        bank,
                        collection_account,
                        amount,
                        balance: Decimal.sub(balance, amount).toNumber()
                    }
                })
                
            })
        } catch (err) {
            console.error(err)
        }
    }
})

