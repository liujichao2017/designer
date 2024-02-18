import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { isAuthenticated } from "~/utils/sessions.server";
import { IdValidator, PaginationWithStatusValidator, IdsValidator } from "~/utils/validators";

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const url = new URL(args.request.url)
  const service = useService("picture", { user })
  const _loader = url.searchParams.get("_loader")

  switch (_loader) {
    case "private":
      return json({ code: ResultCode.OK, "pictures": await service.getPrivatePictures() })
    case "portfolio":
      return json({ code: ResultCode.OK, "pictures": await service.getPortfolioPictures() })
    case "public":
    default:
      {
        const result = await PaginationWithStatusValidator.safeParseAsync(Object.fromEntries(url.searchParams))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        const { last, status } = result.data
        return json({ "pictures": await service.getPublicPictures(last, status) })
      }
  }
}

export type Loader = typeof loader;

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const form = await args.request.formData()
  const _action = form.get("_action")
  const service = useService("picture", { user })
  switch (_action) {
    case "removePicture":
      {
        const result = IdValidator.safeParse(Object.fromEntries(form))
        if (!result.success) fault(ResultCode.FORM_INVALID)
        //@ts-ignore
        return json(await service.removePrivatePicture(result.data.id))
      }
    case "removePortfolio":
      {
        const result = await IdValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) fault(ResultCode.FORM_INVALID)
        //@ts-ignore
        return json(await service.removePortfolioPicture(result.data.id))
      }

    case "importFromPrivate":
      {
        const result = await IdsValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) fault(ResultCode.FORM_INVALID)
        //@ts-ignore
        return json(await service.importFromPrivate(result.data.ids))
      }
  }
}
