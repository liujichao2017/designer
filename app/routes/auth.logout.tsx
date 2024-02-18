import { LoaderArgs, redirect } from "@remix-run/node"
import { redis } from "~/services/database.server"
import { destroySession, getSession, isAuthenticated } from "~/utils/sessions.server"

export const loader = async ({ request, context, params }: LoaderArgs) => {
  const user = await isAuthenticated({ request, context, params })
  if (user) redis.del(`user::${user.id}::roles`)
  const session = await getSession(request.headers.get('Cookie'))

  return redirect('/', { headers: { "Set-Cookie": await destroySession(session) } })
}