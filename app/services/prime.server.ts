import { prisma } from "~/services/database.server";
import dayjs from "dayjs";

export default () => {
  return {
    getPrimeByUid: async (uid: number) => {
      const result = await prisma.prime.findFirst({
        where: { uid }
      })
      return result
    },
    updatePrime: async (id: number, type: number) => {
      const expire = new Date(dayjs().add(3, 'year').format('YYYY-MM-DD'))
      const result = await prisma.prime.update({
        where: { id },
        data: { type, expire }
      })
      return result
    },
    insertPrime: async (uid: number, type: number) => {
      const expire = new Date(dayjs().add(3, 'year').format('YYYY-MM-DD'))
      console.log(uid)
      const prime = await prisma.prime.findFirst({
        where: { uid }
      })
      if (prime) {
        await prisma.prime.delete({
          where: { uid }
        })
      }
      const result = await prisma.prime.create({
        data: { uid, type, expire }
      })
      return result
    }
  }
}