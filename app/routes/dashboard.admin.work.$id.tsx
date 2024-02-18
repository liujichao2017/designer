//@ts-nocheck
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import { DemandStatus } from "~/services/status.server";

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    throw redirect("/auth/logout")
  }
  const { id } = args.params
  const demandService = useService('demand')
  const demand = await demandService.getDemand(+id)

  return json({ demand, code: ResultCode.OK })
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }

}

export default () => {
  const { demand, code } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  if (code !== ResultCode.OK) {
    return <></>
  }

  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg bg-base-100 text-sm p-6 pb-2">
        <b className="text-lg">{t(`demand.typeItem.${demand.type}`).split("（").at(0)}</b>

        <div className="flex gap-6">
          <div className="text-base-content/60">
            <b>{t(`demandorder.detail.demandStatus`)}:</b>
            <b className="text-primary">{t(`demandorder.detail.demandStatusList.${demand.status >= 1000 ? demand.status / 1000 : demand.status}`)}</b>
          </div>

          <div className="text-base-content/60">
            <b>{t(`incomes.list.orderno`)}:</b>
            <b className="text-primary">{"QU-" + demand.id}</b>
          </div>
        </div>

        <div className="flex gap-8 mt-4 font-semibold text-base-content/80">
          <Link to={"/dashboard/admin/work/" + demand.id + "/detail"}
            className={pathname.endsWith("detail") ? "text-primary underline" : ""}>
            {t("demandorder.detail.demandInfo")}
          </Link>

          <Link to={"/dashboard/admin/work/" + demand.id + "/delivery/g"}
            className={pathname.endsWith("delivery/g") ? "text-primary underline" : ""}
          >
            {t("demandorder.detail.delivery")}
          </Link>

          {
            (demand.status ?? 0) > 0 &&
            <Link to={"/dashboard/admin/work/" + demand.id + "/payment"}
              className={pathname.endsWith("payment") ? "text-primary underline" : ""}
            >
              {t("demandorder.detail.payInfo")}
            </Link> ||
            <button onClick={_ => toast({
              title: "Not yet quoted"
            })}>
              {t("demandorder.detail.payInfo")}
            </button>
          }
          <Link to={"/dashboard/admin/work/" + demand.id + "/comment"}
            className={pathname.endsWith("comment") ? "text-primary underline" : ""}
          >
            {t("demandorder.detail.comment")}
          </Link>
          <Link to={"/dashboard/admin/work/" + demand.id + "/message"}
            className={pathname.endsWith("message") ? "text-primary underline" : ""}
          >
            {t("demandorder.detail.messageBoard")}
          </Link>
        </div>

      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-base-100 p-6 mb-12">
        <Outlet />
      </div>
    </div>
  )
}