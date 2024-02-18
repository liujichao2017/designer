import { LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "~/components/ui/Avatar";
import { ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { OperatorHeader } from "~/components/layout/Header";

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const isDesigner = await hasRole(Roles.PRO, args)
  if (!isDesigner) return json({ code: ResultCode.PERMISSION_DENIED, user })

  return json({ code: ResultCode.OK, user })
}

export default function Page () {
  const { user, code } = useLoaderData<typeof loader>()
  if (code !== ResultCode.OK) {
    return (
      <div className="flex gap-6 bg-base-100 justify-center items-center h-full ">
        <Link to="/dashboard/applydesigner"><button className="btn btn-sm btn-primary">申请平台设计师</button></Link>
      </div>
    )
  }

  const { t } = useTranslation()
  const { pathname } = useLocation()
  const active = useRef("text-primary border-b-2 border-primary font-semibold p-2 east-in duration-150")
  const normal = useRef("text-base-content/80 font-semibold p-2 east-in duration-150")

  return (
    <div className="flex flex-col gap-6">

      {/* <OperatorHeader title={t("demandorder.detail.title")}><span/>
      </OperatorHeader> */}

      <div className="px-2 py-6 rounded-xl bg-base-100">
        <Outlet />
      </div>
    </div>
  )
}