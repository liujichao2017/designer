import { LoaderArgs, json } from "@remix-run/node"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { hasRole } from "~/utils/sessions.server"
import { Roles } from "~/utils/store"
import { DemandSearchValidator } from "~/utils/validators"

export async function loader ({ request, context, params }: LoaderArgs) {
  const isAdmin = await hasRole(Roles.BACK_ADMIN, { request, context, params })
  const { searchParams } = new URL(request.url)
  const _loader = searchParams.get('_loader')
  const result = DemandSearchValidator.safeParse(Object.fromEntries(searchParams))
  if (!result.success) return fault(ResultCode.FORM_INVALID)
  const userService = useService('user')
  const userRoleService = useService('userRole')
  const roleService = useService('role')
  switch (_loader) {
    case 'search':
      const designerList = await userService.getSearchList(result.data.keyword || '')
      return json({
        code: ResultCode.OK,
        designerList
      })
    case "recommend":
      return json({
        code: ResultCode.OK,
        recommends: (await useService("admin").getRecommandDesigners())
      })
  }
}