import { LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "~/components/ui/Avatar";
import { ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";

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

      <div className="flex flex-col px-10 pt-6 justify-between bg-base-100 rounded-xl gap-6 text-sm">
        <div className="flex justify-between text-sm">
          <div className="flex gap-3">
            <Link to="/portfolio">
              <Avatar user={user} size="md" />
            </Link>
            <div className="flex flex-col gap-1">
              <Link to="/portfolio" className="font-semibold text-[1.05rem]">{user.name}</Link>
              <small>ID：{user.id + 88888}</small>
            </div>
          </div>
          <Link to="/portfolio" className="btn rounded-md lg:px-8">{t("pro.profile")}</Link>
        </div>

        <div className="flex gap-12 justify-center lg:justify-start">
          <Link to="/dashboard/designer/library"
            className={pathname.endsWith("library") ? active.current : normal.current}>
            {t("pro.library")}
          </Link>
          <Link to="/dashboard/designer/orders/all"
            className={/.*orders*/.test(pathname) ? active.current : normal.current}>
            {t("pro.orders")}
          </Link>
          <Link to="/dashboard/designer/scores"
            className={pathname.endsWith("scores") ? active.current : normal.current}>
            {t("pro.scores")}
          </Link>
        </div>
      </div>

      <div className="px-2 py-6 rounded-xl bg-base-100">
        <Outlet />
      </div>
    </div>
  )
}