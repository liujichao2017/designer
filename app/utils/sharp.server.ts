import { PDFDocument } from 'pdf-lib'
import gm from "gm"
import sharp from "sharp"
import * as gs from "ghostscript-node"

export const getPdfMeta = async (content: string) => {
  const pdf = await PDFDocument.load(Buffer.from(content, "base64"))
  return { pageCount: pdf.getPageCount(), width: pdf.getPage(0).getWidth(), height: pdf.getPage(0).getHeight() }
}

const pdfPagetoBuffer = async (g: gm.State, page: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    g.selectFrame(page).density(96, 96).setFormat("png").quality(78).bitdepth(8)
      .toBuffer((err, buffer) => {
        if (err) return reject(err)
        return resolve(buffer.toString("base64"))
      })
  })
}

export const pdfToImage = async (data: string) => {
  const body = data.split(";base64,").at(1)!
  const { pageCount } = await getPdfMeta(body)
  const g = gm(Buffer.from(body, "base64"))
  // const buffers = await Promise.all(Array.from({ length: pageCount }, (_, i) => pdfPagetoBuffer(g, i)))
  const buffers = await Promise.all(Array.from({ length: 1 }, (_, i) => pdfPagetoBuffer(g, i)))
  return buffers
}

export const __pdfToImage = async (data: string) => {
  const body = data.split(";base64,").at(1)!
  const buffers = (await gs.renderPDFPagesToPNG(Buffer.from(body, "base64"), undefined, undefined, 150)).map(val => val.toString("base64"))
  return buffers
}

export type ThumbnailOption = {
  size?: number
  quality?: number
  format: "png" | "jpeg"
}

const defaultThumbnailOption: ThumbnailOption = {
  size: 280, quality: 68, format: "png"
}

export const thumbnail = async (data: string, size: number) => {
  return await new Promise<string>(
    (resolve, reject) => {
      gm(Buffer.from(data, "base64"))
        .setFormat("png")
        .resize(size)
        .quality(58)
        .toBuffer((err, buffer) => {
          if (err) reject(err)
          resolve(buffer.toString("base64"))
        })
    })
}

export const fastthumbnail = async (data: string, option: ThumbnailOption = defaultThumbnailOption): Promise<Buffer> => {
  option = { ...defaultThumbnailOption, ...option }
  return (await sharp(Buffer.from(data, "base64"))
    .toFormat(option.format, { quality: option.quality })
    .resize({ width: option.size })
    .toBuffer())
}