import { LoaderArgs, ActionArgs, createCookieSessionStorage } from "@remix-run/node";
import { Roles, UserProps } from "./store";
import { prisma, redis } from "~/services/database.server";

const RoleCacheExpired = 180

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "ss__", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: false, // for security reasons, make this cookie http only
    secrets: ["((J=3#)!D~|teMe90123;?%^asdbvyYkal)"], // replace this with an actual secret
    // secure: process.env.NODE_ENV === "production", // enable this in prod only
    secure: false
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
export const isAuthenticated = async ({ request, context }: LoaderArgs | ActionArgs) => {
  const session = await getSession(request.headers.get('Cookie'))
  if (context.current) {
    return context.current as UserProps
  }
  try {
    context.current = session.has('user') && JSON.parse(session.get('user'))
    return context.current as UserProps
  } catch (err) {
    return null
  }
}

export const getCurrent = isAuthenticated

export const hasRole = async (name: Roles, { request, context }: LoaderArgs | ActionArgs) => {
  if (context.roles) {
    return (context.roles as string[]).includes(name)
  }
  try {
    const auth = await isAuthenticated({ request, context, params: {} })
    if (!auth) return false
    const key = `user::${auth.id}::roles`
    let roles = await redis.get(key)
    if (roles) {
      context.roles = JSON.parse(roles)
      return (context.roles as string[]).includes(name)
    }
    const user = await prisma.user.findFirst({
      where: { id: auth.id },
      select: {
        roles: {
          select: { role: { select: { id: true, name: true } } }
        }
      }
    })
    context.roles = user?.roles.map(val => val.role?.name)
    await redis.set(key, JSON.stringify(context.roles))
    redis.expire(key, RoleCacheExpired)
    return (context.roles as string[]).includes(name)
  } catch (err) {
    return false
  }
}

export const getRoles = async ({ request, context }: LoaderArgs | ActionArgs) => {
  if (context.roles) {
    return context.roles as string[]
  }
  try {
    const auth = await isAuthenticated({ request, context, params: {} })
    if (!auth) return []
    const key = `user::${auth.id}::roles`
    let roles = await redis.get(key)
    if (roles) {
      context.roles = JSON.parse(roles)
      return context.roles as string[]
    }
    const user = await prisma.user.findFirst({
      where: { id: auth.id },
      select: {
        roles: {
          select: { role: { select: { id: true, name: true } } }
        }
      }
    })
    context.roles = user?.roles.map(val => val.role?.name)
    await redis.set(key, JSON.stringify(context.roles))
    redis.expire(key, RoleCacheExpired)
    return context.roles as string[]
  } catch (err) {
    return []
  }
}
