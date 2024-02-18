import { chunk, maxBy, omit } from "lodash"
import { groupBy } from "~/utils/helpers"
import { prisma, redis } from "./database.server"
import { Roles, UserProps } from "~/utils/store"
import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"

const quotationConfig = {
  0: { //type 0 小册子
    base: {
      suiteDiscount: 0.3,
      price: 278,
      basePages: 8,
      discount: 0.99,
      minPrice: 150,
      levelRadio: {
        4: 1,
        1: 0.67,
        2: 0.78,
        3: 0.89,
        5: 1.29,
        6: 1.73,
        7: 2
      }
    },
    0: {  //size A5
      radio: 0.85
    },
    1: { //size A4
      radio: 1
    }
  },

  2: { //传单leaflet
    base: {
      suiteDiscount: 0.2,
      price: 1480,
      levelRadio: {
        4: 1,
        1: 0.8,
        2: 0.8,
        3: 0.8,
        5: 1.25,
        6: 1.5,
        7: 2
      }
    }
  },


  4: { //海报
    base: {
      suiteDiscount: 0.2,
      price: 1280,
      levelRadio: {
        4: 1,
        1: 0.8,
        2: 0.8,
        3: 0.8,
        5: 1.3,
        6: 1.75,
        7: 2.5
      }
    }
  },

  5: { //包装
    base: {
      suiteDiscount: 0.2,
      price: 980,
      levelRadio: {
        4: 1,
        1: 0.8,
        2: 0.8,
        3: 0.8,
        5: 1.3,
        6: 1.75,
        7: 2.2
      }
    }
  }
}

export function getQuotationPlain (type: number, pages: number, size: number, level: number = 4, service: number = 0, suite = 0) {
  //@ts-ignore
  const cfg = quotationConfig[type]
  const base = cfg?.base
  if (service === 2) {
    return { price: 0, totalPrice: 0, pages, discount: 0, printPrice: 0 }
  }
  switch (type) {
    case 0:
      {
        //@ts-ignore
        const config = cfg[size ?? -1]
        if (!config) return {}
        const discountPages = pages - base.basePages > 62 ? 62 : pages - base.basePages
        let price = Math.pow(base.discount, discountPages) * base.price
        price = price >= base.minPrice ? price : base.minPrice

        //@ts-ignore
        const levelRadio = base.levelRadio[level] ?? 1
        price = price * levelRadio * config.radio

        return {
          ...{
            price, totalPrice: price * pages, pages, discount: base.suiteDiscount, levels: base.levelRadio
          },
          ...((service === 2) ? { printPrice: 0 } : {})
        }
      }
    //logo
    case 1:
      {
        const suites = new Map(Object.entries({
          0: 3980,
          1: 5980,
          2: 7880
        }))
        if (!suites.has(suite + "")) return { price: 0, totalPrice: 0, pages: 0 }

        const price = suites.get(suite + "")
        return {
          ...{ price, totalPrice: price, pages: 0 },
          ...((service === 2) ? { printPrice: 0 } : {})
        }
      }
    //card
    case 3:
      {
        const designPrice = suite === 1 ? 798 : 99
        const price = service === 1 ? designPrice + 300 : designPrice
        return {
          ...{ price, totalPrice: price, pages: 0 },
          ...((service === 2) ? { printPrice: 0 } : {})
        }
      }
    //ppt
    case 11:
      {
        const suites = new Map(Object.entries({
          0: 980,
          1: 1280,
          2: 1580
        }))
        if (!suites.has(suite + "")) return { price: 0, totalPrice: 0, pages: 0 }

        const price = suites.get(suite + "")
        return {
          ...{ price, totalPrice: price, pages: 0, discount: 0.2 },
          ...((service === 2) ? { printPrice: 0 } : {})
        }
      }
    //post  package  Leaflet
    case 2:
    case 4:
    case 5:
      {
        //@ts-ignore
        const levelRadio = base.levelRadio[level] ?? 1
        const price = base.price * levelRadio
        return {
          ...{ price, totalPrice: price, pages: 1, discount: base.suiteDiscount, levels: base.levelRadio },
          ...((service === 2) ? { printPrice: 0 } : {})
        }
      }
    default:
      return {
        ...{ price: 0, totalPrice: 0, pages, discount: 0 },
        ...((service === 2) ? { printPrice: 0 } : {})
      }

  }
}

export async function getQuotationLevelPlain (ids: number[]) {
  const data = await prisma.picture.findMany({
    where: { id: { in: ids } },
    select: { id: true, level: true }
  })
  const levelFactor = [3999, 2499, 1499, 1003, 1000]
  const pictures = ids
    .map((id, index) => ([data.find(val => val.id === id)?.level ?? 0, (levelFactor.at(index) ?? 0)]))
    .filter(([level, _]) => level)


  const items = groupBy(pictures, ([level, _]) => level)
  const level = maxBy(Object.entries(items).map(([level, scores]) =>
    ({ level, scores: scores.map(([_, s]) => s).reduce((a, b) => a + b, 0) })
  ), val => val.scores)?.level
  return level && +level || 4
}

/**
 * Asynchronously retrieves the designer's category level based on the provided 
 * ID and category ID.
 *
 * @param {number} id - The ID of the designer
 * @param {number} categoryId - The ID of the category
 * @return {number | undefined} The level of the designer's picture, or undefined
 */
export async function getDesignerCategoryLevel (id: number, categoryId: number) {
  const designer = await prisma.user.findUnique({
    where: { id },
    select: {
      pictures: {
        where: {
          tags: { some: { id: categoryId } }
        },
        select: { id: true, level: true },
        orderBy: { level: "desc" },
        take: 2
      },
      id: true
    }
  })
  return designer?.pictures?.at(0)?.level ?? 0
}

export async function getDesignerCategoryCount (id: number, categoryId: number) {
  await prisma.picture.count({
    where: {
      tags: { some: { id: categoryId } }
    }
  })
}

const recommendDesignersPageCount = 3
const recommendDesignersExpire = 60 * 3 //3minus

type RecommendResult = {
  id: number, name: string,
  email: string, avatar?: string,
  profile: { description?: string },
  portfolios: { id: number, img_url: string, thumbnail_url: string }[],
  _score: number
}

const designerSelect = {
  id: true, name: true, email: true, avatar: true,
  profile: { select: { description: true } },
  portfolios: { take: 6 },
} satisfies Prisma.userSelect


/**
 * Function to retrieve designers based on pictures and various criteria.
 *
 * @param {number[]} ids - The array of picture ids
 * @param {number} [demandId=-1] - The demand id
 * @param {number} [category=-1] - The category id
 * @param {number} [page=1] - The page number
 * @return {RecommendResult[]} The array of recommended designers
 */
export async function getDesignersByPictures (ids: number[], demandId: number = -1, category: number = -1, page: number = 1) {
  if (!ids) {
    const designer = await prisma.user.findFirst({
      where: { email: "hobbyland.designer@gmail.com" },
      select: designerSelect
    })
    return [{ ...designer, _score: 100 }]
  }
  const hash = createHash("md5").update(`${demandId}${JSON.stringify(ids)}${category}`).digest("hex")
  const hasCache = await redis.exists(hash)
  if (hasCache) {
    const data = chunk(await redis.zrevrange(hash,
      (page - 1) * recommendDesignersPageCount,
      page * recommendDesignersPageCount - 1,
      "WITHSCORES"), 2)
    return data.map(([entry, score]) =>
      ({ ...JSON.parse(entry), _score: +score } as unknown as RecommendResult)
    )
  }
  const rejected = demandId ?
    (await prisma.demand_rejected_designer.findMany({
      where: { demand_id: demandId },
      select: { user_id: true }
    })).map(val => val.user_id) :
    [];

  // const selectionDesigners = designersData.map((d) => {
  //   const _score = ids.map((id, index) => {
  //     return (d.pictures.find(val => val.id === id)) ? (scoresCfg.at(index) ?? 0) : 0
  //   }).reduce((a, b) => a + b, 0) * 0.7
  //   return { ...d, _score }
  // })
  // .sort((a, b) => {

  //   if (a._score > b._score) return -1
  //   if (a._score < b._score) return 1
  //   return 0
  // })

  const scoresCfg = [50, 35, 25, 20, 15]

  const selectionDesigners = Object.entries(
    groupBy(
      (await Promise.all(ids.map((id, index) =>
        (async () => {
          const data = await prisma.user.findFirst({
            where: {
              id: { notIn: rejected },
              pictures: { some: { id } },
              roles: { some: { role: { name: Roles.PRO } } }
            },
            select: designerSelect
          })
          return { ...data, _score: scoresCfg.at(index) ?? 0 }
        })()
      ))).filter(v => !!v.id), v => v.id + ""))
    .map(([_, entries]) => {
      const _score = entries
        .map(v => v._score)
        .reduce((a, b) => a + b, 0)
      return { ...entries.at(0), _score: _score > 70 ? 70 : _score }
    })
  const categoryDesigners = category > 0 ? getCategoryScoreByPictures(await getUserPicturesCountByCategory(category) as User[]) : []

  const level = await getQuotationLevelPlain(ids)
  const someLevelDesigners = getLevelScoreByPictures(await getUserPicturesCountByLevel(level, rejected, true) as User[], 4)

  const minus1LevelDesigners = level - 1 > 0 ?
    getLevelScoreByPictures(await getUserPicturesCountByLevel(level - 1, rejected) as User[], 2) :
    []
  const minus2LevelDesigners = level - 2 > 0 ?
    getLevelScoreByPictures(await getUserPicturesCountByLevel(level - 2, rejected) as User[], 1) :
    []

  let designers = Object.entries(
    groupBy(
      [...selectionDesigners, ...categoryDesigners, ...someLevelDesigners, ...minus1LevelDesigners, ...minus2LevelDesigners],
      v => v.id + ""))
    .map(([_, entries]) => {
      const _score = entries
        .map(v => v._score)
        .reduce((a, b) => a + b, 0)
      return { ...entries.at(0), _score }
    })
    .sort((a, b) => b._score - a._score)

  const scoredCache = designers.map(d => [d._score, JSON.stringify(d)])
  if (process.env.NODE_ENV === "production") {
    //@ts-ignore
    redis.zadd(hash, ...scoredCache)
    redis.expire(hash, recommendDesignersExpire)
  }
  return designers.slice(
    (page - 1) * recommendDesignersPageCount,
    page * recommendDesignersPageCount) as RecommendResult[]
}

type User = { _count: { pictures: number } } & UserProps;
type UserScore = { _score: number } & User
type LevelFactor = 4 | 2 | 1
function getLevelScoreByPictures (users: User[], factor: LevelFactor) {
  const cfg = {
    4: 12,
    2: 5,
    1: 3
  }
  return users.map(user => {
    const score = user._count.pictures * factor * 0.2
    const max = cfg[factor]
    return { ...omit(user, "_count"), _score: score > max ? max : score }
  })
}

function getCategoryScoreByPictures (users: User[]) {
  return users.map(user => {
    const score = Math.floor((user._count.pictures - 5) / 5) * 5 + 20
    return { ...omit(user, "_count"), _score: (score > 50 ? 50 : score) / 5 }
  })
}

export async function getUserPicturesCountByCategory (categoryId: number, rejected: number[] = []) {
  return await prisma.user.findMany({
    where: {
      id: { notIn: rejected },
      roles: { some: { role: { name: Roles.PRO } } },
      pictures: {
        some: { tags: { some: { id: categoryId } } }
      }
    },
    select: {
      ...designerSelect,
      _count: {
        select: { pictures: true }
      }
    },
  })
}

export async function getUserPicturesCountByLevel (level: number, rejected: number[] = [], grow = false) {
  const condition = grow ? { level: { gte: level } } : { level }
  return await prisma.user.findMany({
    where: {
      id: { notIn: rejected },
      roles: { some: { role: { name: Roles.PRO } } },
      pictures: {
        some: condition
      }
    },
    select: {
      ...designerSelect,
      _count: {
        select: { pictures: true }
      }
    }
  })
}
