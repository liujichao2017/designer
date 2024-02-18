import { LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { isAuthenticated } from "~/utils/sessions.server";
import { UserProps } from "~/utils/store";

export const loader = async (args: LoaderArgs) => {
  const { code } = args.params
  // const user = await isAuthenticated(args)
  // if (user) throw redirect("/dashboard/project")

  if (!code) throw redirect("/auth/signin")

  const u = await useService("auth").activeAccount(code)
  if (!u) {
    return fault(ResultCode.INVALID_ACTIVE_CODE)
  }
  useService("mail", { user: u as UserProps }).sendActivedMail()
  return json({ code: ResultCode.OK })
}

export default () => {
  const { code } = useLoaderData<typeof loader>()
  if (code === ResultCode.OK) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 mt-10 bg-base-100">
        <h1 className="font-bold text-2xl">Congratulations, account actived</h1>
        <p>
          <Link to="/auth/signin" className="link link-success font-medium">Back to sign in</Link>
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col justify-center items-center gap-2 mt-10 bg-base-100">
      <h1 className="font-bold text-2xl">Something went wrong</h1>
      <p className="italic">Error Code: {code}</p>
      <p>
        <Link to="/auth/signin" className="link link-error font-medium">Back to sign in</Link>
      </p>
    </div>
  )
}