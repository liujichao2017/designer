import { LoaderArgs, json } from "@remix-run/node"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { IdValidator } from "~/utils/validators"
import { cors } from "remix-utils";


export async function loader ({ request }: LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const _loader = searchParams.get("_loader")
  const result = IdValidator.safeParse(Object.fromEntries(searchParams))
  if (!result.success) return fault(ResultCode.FORM_INVALID)
  switch (_loader) {
    case "project":
      return cors(request, json({ code: ResultCode.OK, cipher: await useService("project").getShareLink(result.data.id) }))
  }
}