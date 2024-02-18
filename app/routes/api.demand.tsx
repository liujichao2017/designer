//@ts-nocheck
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { encrypto } from "~/utils/crypto.server";
import { ResultCode, fault } from "~/utils/result";
import { getCurrent, hasRole } from "~/utils/sessions.server";
import { IdValidator, IdsValidator, IdsWithCategoryValidator } from "~/utils/validators";
import { cors } from "remix-utils";
import { getDesignersByPictures } from "~/services/logic.server";
import { Roles } from "~/utils/store";

export async function loader ({ request, context }: LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const _loader = searchParams.get("loader")
  const user = await getCurrent({ request, context })

  switch (_loader) {
    case "recommentByPictures":
      {
        const result = IdsWithCategoryValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        const designers = await getDesignersByPictures(result.data.ids, -1, result.data.category ?? -1)
        console.log(designers)
        console.log(result.data.ids, result.data.category, 1)

        return json({ designers })
      }
    case "quotation":
      {
        const isAdmin = await hasRole(Roles.BACK_ADMIN, { request, context })
        // if (!isAdmin) return json({ code: ResultCode.PERMISSION_DENIED })
        const result = IdValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        const service = useService("demand")
        const demand = await service.getDemand(result.data.id)
        if (!demand) return fault(ResultCode.DATABASE_ERROR)
        const level = await service.getQuotationLevelPlain(JSON.parse(demand.picture_id ?? "[]"))
        const quotation = service.getQuotations(demand, level, isAdmin)
        return cors(request, json({ code: ResultCode.OK, quotation, level, pdf: demand.quotation_pdf ?? quotation.pdf ?? "" }))
      }
    case "quotationPlain":
      {
        const pictures = searchParams.get("pictures")?.split(",").map(val => +val) ?? []
        const type = searchParams.get("type") ?? -1
        const pages = searchParams.get("pages") ?? 0
        const size = searchParams.get("size") ?? -1
        const sv = searchParams.get("service") ?? 0
        const suite = searchParams.get("suite") ?? 0
        const service = useService("demand")
        const level = await service.getQuotationLevelPlain(pictures)
        return cors(request, json({ code: ResultCode.OK, level, quotation: service.getQuotationPlain(+type, +pages, + size, level, +sv, +suite), pdf: "" }))
      }
    case "sid":
      {
        let id = searchParams.get("id")
        if (!id && !user) return json({ code: ResultCode.FORM_INVALID })
        if (!id) id = user?.id
        if (!id) throw redirect("/auth/signin")
        const sid = encrypto({ ts: Date.now(), id })
        return cors(request, json({ code: ResultCode.OK, sid }))
      }
    case "endpoint":
      return json({ endPoint: process.env.END_POINT })
  }
  return json({ designers: [] })
}

export async function action ({ request }: ActionArgs) {
  const form = await request.formData()
  const _action = form.get("_action")
  switch (_action) {
    case "recommentByPictures":
      {
        const result = IdsWithCategoryValidator.safeParse(Object.fromEntries(form))
        if (!result.success) {
          console.error(result.error)
          return fault(ResultCode.FORM_INVALID)
        }
        const designers = await getDesignersByPictures(result.data.ids, -1, result.data.category ?? -1)
        console.log(designers, result.data.ids)
        return json({ designers })
      }
  }
}

export type DemandLoader = typeof loader
