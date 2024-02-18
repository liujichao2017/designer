import { LoaderArgs, json, redirect } from "@remix-run/node";
import { getRoles, isAuthenticated } from "./sessions.server";

export const loadUser = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (user) {
    const roles = await getRoles(args)
    user.roles = roles
    return json({ user, roles, endPoint: process.env.END_POINT,
      chatEndPoint: process.env.CHAT_END_POINT })
  }
  return redirect("/auth/signin")
}
