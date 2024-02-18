import { OAuth2Client } from "google-auth-library";
import { UserProps } from "~/utils/store";
import { DBStatusCode, prisma } from "./database.server";
import { cryptoPassword } from "~/utils/crypto.server";
import { ResultCode } from "~/utils/result";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID as string,
  process.env.GOOGLE_CLIENT_SECRET as string,
  `${process.env.END_POINT}/auth/google`
);

const googleScope = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
const googleAccessType = "offline"

export type ExtraProfile = {
  id: string
  name: string
  email: string
  picture?: string
}

export default (args: { user: UserProps }) => ({
  googleClient,
  googleScope,
  googleAccessType,
  getGoogleProfile: async (code: string) => {
    const r = await googleClient.getToken(code as string)
    if (!r.tokens) {
      return
    }
    googleClient.setCredentials(r.tokens);
    const { data, status } = await googleClient.request({ url: "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + r.tokens.access_token })

    if (status === 200) {
      return (data as ExtraProfile)
    }
  },

  getGoogleAuthUrl: () => {
    return googleClient.generateAuthUrl({
      access_type: googleAccessType,
      scope: googleScope,
    })
  },

  authWithRemote: async (provider: string, profile: ExtraProfile) => {
    const user = await prisma.user.findFirst({
      where: {
        email: profile.email
      },
      select: {
        auths: true,
        name: true, email: true, id: true, avatar: true, roles: {
          select: { role: { select: { name: true } } }
        },
        teams: {
          select: { team: true }
        }
      }
    })
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: profile.email, name: profile.name, avatar: profile.picture, status: DBStatusCode.VALID,
          auths: {
            create: {
              provider,
              email: profile.email,
              avatar: profile.picture,
              name: profile.name,
            }
          }
        }
      })
      return { id: newUser.id, name: profile.name, email: profile.email, avatar: profile.picture, roles: [], teams: [] }
    }

    if (!user?.auths.map(v => `${provider}:${v.email}`).includes(`${provider}:${profile.email}`)) {
      await prisma.auth.create({
        data: {
          provider,
          email: profile.email,
          avatar: profile.picture,
          name: profile.name,
          uid: user.id
        }
      })
    }
    return user
  },

  authWithRemote2: async (provider: string, profile: ExtraProfile) => {
    const auth = await prisma.auth.findFirst({
      where: { email: profile.email, provider }, select: {
        owner: {
          select: {
            name: true, email: true, id: true, avatar: true, roles: {
              select: { role: { select: { name: true } } }
            },
            teams: {
              select: { team: true }
            }
          }
        }
      }
    })

    if (auth && auth?.owner) {
      console.log("has auth and user")
      return auth.owner
    }

    const user = await prisma.user.findFirst({
      where: { email: profile.email },
      select: {
        name: true, email: true, id: true, avatar: true,
        roles: {
          select: { role: { select: { name: true } } }
        },
      }
    })

    if (user) {
      console.log("has user not auth")
      await prisma.user.update({
        where: { id: user.id },
        data: {
          auths: {
            create: {
              provider,
              email: profile.email,
              avatar: profile.picture,
              name: profile.name,
            }
          }
        }
      })
      return user
    }

    if (!user) {
      console.log("user and auth unexsting")
      const user = await prisma.user.create({
        data: {
          email: profile.email, name: profile.name, avatar: profile.picture, status: DBStatusCode.VALID,
          auths: {
            create: {
              provider,
              email: profile.email,
              avatar: profile.picture,
              name: profile.name,
            }
          }
        }
      })
      return { id: user.id, name: profile.name, email: profile.email, avatar: profile.picture, roles: [], teams: [] }
    }
  },

  authWithLocal: async (email: string, password: string) => {
    console.log(password, cryptoPassword(password))
    const user = await prisma.user.findFirst({
      where: { email, password: cryptoPassword(password) },
      select: {
        id: true, email: true, name: true, avatar: true, status: true,
        roles: {
          select: { role: { select: { name: true } } }
        },
        teams: {
          select: { team: true }
        }
      }
    })
    if (!user) {
      return { code: ResultCode.PASSWORD_INCORRECT }
    }
    if (user?.status !== DBStatusCode.VALID) {
      return { code: ResultCode.ACCOUNT_NOT_ACTIVED, user }
    }
    return { code: ResultCode.OK, user }
  },

  authWithLocalById: async (id: number) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, avatar: true, status: true,
        roles: {
          select: { role: { select: { name: true } } }
        },
        teams: {
          select: { team: true }
        }
      }
    })
    if (!user) {
      return { code: ResultCode.PASSWORD_INCORRECT }
    }
    if (user?.status !== DBStatusCode.VALID) {
      return { code: ResultCode.ACCOUNT_NOT_ACTIVED, user }
    }
    return { code: ResultCode.OK, user }
  },

  createAccount: async (email: string, name: string, password: string) => {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true }
    })
    if (!user) {
      return await prisma.user.create({
        data: {
          email, name, password: cryptoPassword(password)
        }
      })
    }
  },

  activeAccount: async (code: string) => {
    const data = await prisma.code.findFirst({
      where: { code, status: DBStatusCode.VALID }, select: { email: true, id: true }
    })
    if (data) {
      await prisma.code.update({
        where: { id: data.id }, data: { status: DBStatusCode.INVALID }
      })
      const user = await prisma.user.findFirst({ where: { email: data.email as string } })
      if (user) {
        return await prisma.user.update({ where: { id: user.id }, data: { status: 1 } })
      }
    }
  },

  resetPassword: async (email: string, password: string) => {
    const user = await prisma.user.findFirst({ where: { email }, select: { id: true } })
    if (!user) {
      return
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: cryptoPassword(password) }
    })
  }
})
