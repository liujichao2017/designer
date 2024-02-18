import { uploadImageBuffer, uploadImageContent } from "../services/aws.server"
import { fastthumbnail } from "./sharp.server"

type ImageUrls = { url: string, thumbnailUrl: string }
type Callback = (err?: Error, images?: Partial<ImageUrls>[]) => Promise<void> | void

const imageHandler = async (data: string, raw: string, compress = true) => {
  if (!compress) {
    const obj = await uploadImageContent(raw)
    return ["", obj.Location]
  }
  let buf = await fastthumbnail(data, { format: "png", quality: 88, size: 380 })

  return (await Promise.all([
    uploadImageBuffer(buf, "image/png"),
    uploadImageContent(raw)
  ])).map(it => it.Location)
}

export async function uploadImages<T extends string, D extends Buffer> (contents: (T | D)[], callback?: Callback, compress = true) {
  if (!contents.length) return
  try {
    const images = (await Promise.all(contents.map(async it => {
      const val = it as string
      if (!val.startsWith("data:image")) {
        return
      }

      const data = val.split(";base64,").at(1)!
      const [thumbnailUrl, url] = await imageHandler(data, val, compress)
      return { thumbnailUrl, url }
    }))).filter(val => !!val) as ImageUrls[]
    if (callback) callback(undefined, images)
    return images
  } catch (err) {
    callback && callback(err as unknown as Error, undefined)
  }
}