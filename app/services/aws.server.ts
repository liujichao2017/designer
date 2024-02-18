import AWS from "aws-sdk"
import { v4 as uuid } from "uuid"
import fs from "fs/promises"

const formatTypes = ["png", "jpg", "jpeg", "pdf"]
const imageTypes = ["png", "jpg", "jpeg"]
const mimeContentTypes = ["image/png", "image/jpeg", "application/pdf"] as const

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_CLIENT_ID,
  secretAccessKey: process.env.AWS_CLIENT_SECRET
})

export class S3Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = "S3Error"
  }
}

export const uploadImage = async (filepath: string) => {
  const [_, ext] = filepath.split(".")
  if (!formatTypes.includes(ext)) {
    throw new S3Error(`Invalid image type, just allow ${formatTypes.join(",")}`)
  }
  const data = await fs.readFile(filepath)
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: uuid(),
    ContentType: imageTypes.includes(ext) ? "image/" + (ext === "jpg" ? "jpeg" : ext) : "application/pdf",
    Body: data
  }
  return await s3.upload(params).promise()
}

export const uploadImageContent = async (data: string) => {
  if (!data.startsWith("data:image") && !data.startsWith("data:application/pdf") && !data.startsWith("data:application/x-pdf")) {
    throw new S3Error(`Invalid mime type, just allow ${formatTypes.join(",")}`)
  }
  const [contentType, base64] = data.split("data:").at(1)!.split(";base64,")
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: uuid(),
    ContentType: contentType,
    Body: Buffer.from(base64, "base64")
  }
  return await s3.upload(params).promise()
}

export const uploadImageBuffer = async (data: Buffer, contentType: typeof mimeContentTypes[number]) => {
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: uuid(),
    ContentType: contentType,
    Body: data
  }
  return await s3.upload(params).promise()
}

export const deleteObject = async (key: string) => {
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: key
  }
  return await s3.deleteObject(params).promise()
}

export const updateImage = async (key: string, filepath: string) => {
  const [_, ext] = filepath.split(".")
  if (!formatTypes.includes(ext)) {
    throw new S3Error(`Invalid mime type, just allow ${formatTypes.join(",")}`)
  }
  const data = await fs.readFile(filepath)
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: key,
    ContentType: imageTypes.includes(ext) ? "image/" + (ext === "jpg" ? "jpeg" : ext) : "application/pdf",
    Body: data
  }
  return await s3.upload(params).promise()
}

export const updateImageContent = async (key: string, data: string) => {
  if (!data.startsWith("data:image") && !data.startsWith("data:application/pdf")) {
    throw new S3Error(`Invalid mime type, just allow ${formatTypes.join(",")}`)
  }
  const [contentType, base64] = data.split("data:")[1].split(";base64,")
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: key,
    ContentType: contentType,
    Body: Buffer.from(base64, "base64")
  }
  return await s3.upload(params).promise()
}

export const getObject = async (key: string) => {
  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: key
  }
  return await s3.getObject(params).promise()
}
export const uploadFile = async (base64Data: string, name: string, contentType?: string) => {

  const params = {
    Bucket: process.env.AWS_S3_DEFAILT_BUCKET as string,
    Key: `${uuid()}|${name}`,
    ContentType: contentType,
    Body: Buffer.from(removeBase64Prefix(base64Data), "base64"),
  }
  return await s3.upload(params).promise();
}
function removeBase64Prefix (base64String: string) {
  // 找到逗号并分割字符串，逗号后面的部分是实际的Base64数据
  const splitData = base64String.split(',');

  // 如果没有逗号，整个字符串都是Base64数据
  if (splitData.length <= 1) {
    return base64String;
  }

  return splitData[1];
}