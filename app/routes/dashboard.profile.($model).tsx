import { Outlet, useLoaderData } from "@remix-run/react"
import { LoaderArgs, json, redirect, ActionArgs } from "@remix-run/node";
import UserCenterNav from "~/components/layout/ProfileNav"
import { fault, ResultCode } from "~/utils/result";

export async function loader (args: LoaderArgs) {
  const {
    params,
  } = args;

  const {
    model
  } = params;

  return json({ code: ResultCode.OK, model })
}
export default () => {
  const { model } = useLoaderData<typeof loader>()
  console.log('model', model)

  return (
    <div className="flex flex-col gap-2 w-full">

      <div className="w-full flex gap-1">
        <div className="flex justify-center">
          {model &&<UserCenterNav />}
        </div>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>

    </div>
  )
}