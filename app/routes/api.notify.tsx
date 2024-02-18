import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node"
import { eventStream } from "remix-utils"
import { redis } from "~/services/database.server"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { hasRole, isAuthenticated } from "~/utils/sessions.server"
import { Roles } from "~/utils/store"
import { IdValidator, RejectValidator } from "~/utils/validators"

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) return fault(ResultCode.PERMISSION_DENIED)
  const { request } = args
  const { searchParams } = new URL(request.url)
  const loader = searchParams.get("loader")
  const key = `notify::public::${user.id}`
  const service = useService("notify", { user })
  switch (loader) {
    case "event":
      return eventStream(request.signal, (reply, abort) => {
        redis.subscribe(key).then(r => {
          console.log(r, "channel")
          reply({ event: "indicator", data: r as string })
        })
        setInterval(async () => {
          const n = await service.hasUnread()
          console.log(n, "pool")
          if (n) reply({ event: "indicator", data: n.toString() })
        }, 1000 * 15)
        return () => {
          redis.unsubscribe(key)
          abort()
        }
      })
    case "indicator":
      {
        const n = await service.hasUnread()
        return json({ code: ResultCode.OK, count: n })
      }
    case "all":
      {
        const last = searchParams.get("last")
        const notifies = await service.getNotifies(last ? +last : -1)
        return json({ code: ResultCode.OK, notifies })
      }
    case "unread":
      {
        const last = searchParams.get("last")
        const notifies = await service.getUnread(last ? +last : -1)
        return json({ code: ResultCode.OK, notifies })
      }

    case "markReaded":
      {
        const result = IdValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await service.markReaded(result.data.id)
        return json({ code: ResultCode.OK })
      }
    case "markAllReaded":
      {
        await service.markAllReaded()
        return json({ code: ResultCode.OK })
      }

    case "remove":
      {
        const result = IdValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await service.remove(result.data.id)
        return json({ code: ResultCode.OK })
      }
    case "approve":
      {
        const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
        if (!isAdmin) return fault(ResultCode.PERMISSION_DENIED)
        const result = IdValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await service.approvePro(result.data.id)
        return json({ code: ResultCode.OK })
      }
    case "reject":
      {
        const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
        if (!isAdmin) return fault(ResultCode.PERMISSION_DENIED)
        const result = RejectValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await service.rejectPro(result.data.id, result.data.reason ?? "")
        return json({ code: ResultCode.OK })
      }

  }
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/login")
  const { request } = args

  const form = await request.formData()
  const _action = form.get("_action")
  const service = useService("notify", { user })

  switch (_action) {
    case "markReaded":
      {
        const result = IdValidator.safeParse(Object.fromEntries(form))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await service.markReaded(result.data.id)
        return json({ code: ResultCode.OK })
      }
    case "markAllReaded":
      {
        await service.markAllReaded()
        return json({ code: ResultCode.OK })
      }
  }
}

export type NotifyLoader = typeof loader
export type NotifyAction = typeof action