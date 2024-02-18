import crypto from "node:crypto"

export const aes128ecb = (key) => {
  return {
    encrypto: (data) => {
      const cipher = crypto.createCipheriv('aes-128-ecb', key.slice(0, 16), "")
      return cipher.update(data, "utf8", "hex") + cipher.final("hex")
    },
    decrypto: (data) => {
      const cipher = crypto.createDecipheriv('aes-128-ecb', key.slice(0, 16), "")
      return cipher.update(data, "hex", "utf8") + cipher.final("utf8")
    }
  }
}

export const encrypto = (data) => {
  const key = process.env.KEY
  if (!key) {
    throw new Error(`Env var KEY  is not set`)
  }
  return aes128ecb(key).encrypto(JSON.stringify(data))
}

export const decrypto = (data) => {
  const key = process.env.KEY
  if (!key) {
    throw new Error(`Env var KEY is not set`)
  }
  return JSON.parse(aes128ecb(key).decrypto(data))
}

export const cryptoPassword = (password) => {
  const salt = process.env.PASSWORD_SALT
  if (!salt) {
    throw new Error(`Env var PASSWORD_SALT is not set`)
  }
  return crypto.createHash("md5").update(`${process.env.PASSWORD_SALT}_${password}`).digest("hex")
}
export const cipherPassword = (password) => {
  const salt = process.env.PASSWORD_SALT
  if (!salt) {
    throw new Error(`Env var PASSWORD_SALT is not set`)
  }
  return encrypto({ pw: `${process.env.PASSWORD_SALT}_${password}` })
}
export const decipherPassword = (data) => {
  const [_, password] = (decrypto(data).pw as string).split("_")
  return password
}