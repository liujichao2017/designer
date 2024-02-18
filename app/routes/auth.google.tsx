import { LoaderArgs, json, redirect } from "@remix-run/node"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { commitSession, getSession } from "~/utils/sessions.server"

export const loader = async ({ request }: LoaderArgs) => {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  if (!code) {
    return json({ error: "No code" }, { status: 406 })
  }
  const service = useService("auth")
  const profile = await service.getGoogleProfile(code as string)
  if (!profile) {
    return fault(ResultCode.GOOGLE_ERROR)
  }
  const user = await service.authWithRemote("google", profile)
  const roles = user?.roles.map(r => r.role?.name)
  const session = await getSession(request.headers.get("Cookie"))
  session.set("user", JSON.stringify(user))
  session.set("roles", JSON.stringify(roles))
  return redirect("/dashboard/project", { headers: { "Set-Cookie": await commitSession(session) } })
} 