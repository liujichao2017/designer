import { LoaderArgs, json } from "@remix-run/node";
import { getDesignerCategoryLevel } from "~/services/logic.server";
import { ResultCode, fault } from "~/utils/result";
import { IdsValidator } from "~/utils/validators";

export async function loader (args: LoaderArgs) {
  const { searchParams } = new URL(args.request.url)

  const _loader = searchParams.get("loader")

  switch (_loader) {
    case "categoryLevel":
      let category = +(searchParams.get("category") ?? "")
      if (!category) {
        return fault(ResultCode.FORM_INVALID)
      }
      const result = IdsValidator.safeParse(Object.fromEntries(searchParams))
      if (!result.success) {
        return fault(ResultCode.FORM_INVALID)
      }

      const pd = result.data.ids?.map(id =>
        (async () => {
          const level = await getDesignerCategoryLevel(id, category)
          return { level, id }
        })()
      )

      if (!pd) {
        return fault(ResultCode.FORM_INVALID)
      }

      const levels = await Promise.all(pd)

      return json({ code: ResultCode.OK, levels })
  }
}