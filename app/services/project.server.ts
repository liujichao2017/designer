import { UserProps } from "~/utils/store"
import { prisma } from "./database.server"
import { ResultCode } from "../utils/result"
import { uploadImages } from "../utils/upload.server"
import { pdfToImage } from "~/utils/sharp.server"
import { uploadImageContent } from "./aws.server"
import { encrypto } from "~/utils/crypto.server"

const uploadSilent = async (id: number, pages: string[], raw: string) => {
  const pdfUrl = await uploadImageContent(raw)
  await prisma.project_list.update({
    where: { id }, data: { pdf_url: pdfUrl.Location }
  })
  const images = await uploadImages(pages.slice(1))
  if (!images) return
  for (let [i, page] of images.entries()) {
    const { url, thumbnailUrl } = page
    await prisma.project_list_image.create({
      data: { litpic_url: thumbnailUrl, img_url: url, page: i + 2, project_list_id: id }
    })
  }
}

export default ({ user }: { user: UserProps }) => ({
  getProject: async (id: number) => {
    return await prisma.project_list.findMany({
      where: { project_id: id },
      select: {
        project_name: true, id: true, created_at: true, updated_at: true,
        project: true,
        pages: {
          where: { page: 1 }, select: { litpic_url: true }
        }
      }
    })
  },
  list: async () => {
    // await sleep(3000)
    return await prisma.project.findMany({
      where: {
        user_id: user.id
      },
      select: {
        project_name: true, id: true, created_at: true, updated_at: true,
        owner: {
          select: { name: true, email: true }
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
  create: async (name: string) => {
    try {
      const project = await prisma.project.create({ data: { project_name: name, user_id: user.id } })
      return { code: ResultCode.OK, project }
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR }
    }
  },
  delete: async (id: number) => {
    try {
      const deleted = await prisma.project.delete({ where: { id, user_id: user.id } })
      return { code: ResultCode.OK, deleted }
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR }
    }
  },
  rename: async (id: number, name: string) => {
    try {
      const project = await prisma.project.update({
        where: { id, user_id: user.id }, data: { project_name: name }
      })
      return { code: ResultCode.OK, project }
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR }
    }
  },

  renameBook: async (id: number, name: string) => {
    return await prisma.project_list.update({
      where: { id },
      data: { project_name: name }
    })
  },

  removeBook: async (id: number) => {
    return await prisma.project_list.delete({ where: { id } })
  },

  uploadBook: async (id: number, uid: number, contents: string[], type?: number) => {
    //for pdf
    const pdfContents = contents.filter(val => val.startsWith("data:application/pdf"))
    const pdfBooks = await Promise.all(pdfContents.map(val => pdfToImage(val)))

    for (let i = 0; i < pdfBooks.length; i++) {
      const book = pdfBooks[i]
      const raw = pdfContents[i]
      // console.log("Start pdf upload")
      // console.time("start upload pdf")
      // const images = await uploadImages(book.map(val => `data:image/png;base64,${val}`))
      // const pdfUrl = await uploadImageContent(raw)
      // console.timeEnd("start upload pdf")
      // if (!images) return { code: ResultCode.AWS_ERROR }
      // const bookEntry = await prisma.project_list.create({
      //   data: { project_name: Date.now().toString(), user_id: uid, project_id: id, page: images.length, pdf_url: pdfUrl.Location }
      // })
      // for (let [i, page] of images.entries()) {
      //   const { url, thumbnailUrl } = page
      //   await prisma.project_list_image.create({
      //     data: { litpic_url: thumbnailUrl, img_url: url, page: i + 1, project_list_id: bookEntry.id }
      //   })
      // }
      const firstPage = await uploadImages([`data:image/png;base64,${book[0]}`])
      if (!firstPage) return { code: ResultCode.AWS_ERROR }
      const pdfUrl = await uploadImageContent(raw)
      if (!pdfUrl) return { code: ResultCode.AWS_ERROR }
      const bookEntry = await prisma.project_list.create({
        data: {
          project_name: Date.now().toString(),
          user_id: uid,
          project_id: id,
          page: book.length,
          type: type,
          pdf_url: pdfUrl.Location
        }
      })
      for (let [i, page] of firstPage.entries()) {
        const { url, thumbnailUrl } = page
        await prisma.project_list_image.create({
          data: { litpic_url: thumbnailUrl, img_url: url, page: i + 1, project_list_id: bookEntry.id }
        })
      }
      // uploadSilent(bookEntry.id, book.map(val => `data:image/png;base64,${val}`), raw)
    }

    //for image
    const imageContents = contents.filter(val => val.startsWith("data:image"))
    const images = await uploadImages(imageContents)
    if (!images) return { code: ResultCode.AWS_ERROR }
    const projects = await Promise.all(images.map(({ url, thumbnailUrl }) =>
      (async () => await prisma.project.update({
        where: { id },
        data: {
          books: {
            create: {
              user_id: uid, page: 1, project_name: Date.now().toString(),
              type: type,
              pages: {
                create: {
                  litpic_url: thumbnailUrl, img_url: url, page: 1,
                }
              }
            }
          }
        }
      }))()
    ))
    projects.filter(val => !val.id).map(val => console.error(val))
    return { code: ResultCode.OK }
  },

  getShareLink: async (id: number) => {
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) return ""
    const cipher = encrypto({ expire: Date.now() + 60 * 60 * 1000, id })
    return process.env.END_POINT + "/share/project/" + cipher
  }
})