import { LoaderArgs, json, redirect, ActionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useParams, useFetcher } from "@remix-run/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { OperatorHeader } from "~/components/layout/Header";
import { DemandStatusValidator, DemandStatusChangeValidator } from "~/utils/validators"
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { fault, ResultCode } from "~/utils/result";
import { Roles } from "~/utils/store";
import { OrderStatus } from "~/components/ui/OrderDetail";
import { useService } from "~/services/services.server";
import { TimelineStatus } from '@/utils/definition';
import dayjs from 'dayjs';
import { Button } from "@/components/ui/button"
import i18next from "~/i18next.server";

import {
  ChevronDownIcon,
} from "@radix-ui/react-icons"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
export async function loader (args: LoaderArgs) {
  const {
    request,
    params,
  } = args;
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const isDesigner = await hasRole(Roles.PRO, args)
  if (!isDesigner) return json({ code: ResultCode.PERMISSION_DENIED })
  const {
    id
  } = params;
  let requirement = {};
  let designerQuotation = null;
  let fromDesignerFlag = null;
  if (id) {
    requirement = await getRequirment(Number.parseInt(id, 10))
    const demand = await useService('demand').getDemand(parseInt(id))
    fromDesignerFlag = (demand && demand.from_designer_flag) ? demand.from_designer_flag : ''
    designerQuotation = await useService('designerQuotation').getDemandDesignerQuotation(parseInt(id));
  }

  return json({ code: ResultCode.OK, fromDesignerFlag, requirement, designerQuotation })
}

export const action = async (args: ActionArgs) => {
  const form = await args.request.json()
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const {
    request,
  } = args;
  let locale = await i18next.getLocale(request)
  const notifyService = useService("notify", { user });
  switch (form._action) {
    case 'statuschange': {
      const service = useService("designer");
      const demandservice = useService("demand");
      const result = await DemandStatusChangeValidator.safeParse(form)
      if (!result.success) return fault(ResultCode.FORM_INVALID)
      await service.rejectDemand(result.data.id, result.data.status, undefined)
      if (user) {
        // await notifyService.acceptDemondByDesign(user?.id,form.to,"设计师解决接受您的需求将重新分配")
        await notifyService.rejectJob(result.data.id)
        await demandservice.rejectJob(result.data.id, user.id)
      }
      return json({ code: ResultCode.OK })
    }
    case 'accept': {
      const service = useService("designer");
      const result = await DemandStatusValidator.safeParse(form)
      if (!result.success) return fault(ResultCode.FORM_INVALID)
      // 创建项目
      if (user) {
        const project = await useService("project", { user }).create(`new_${Date.now()}`)
        const demandService = useService("demand");
        const currentDate = dayjs();
        const fulltime = currentDate.add(2, 'day');
        await service.acceptDemand(result.data.id, result.data.status, project.project?.id, result.data.designer_user_id)
        await demandService?.updataTimelineStatus(form.id, TimelineStatus.DESINNERCONFIRMED, fulltime?.toDate())
        await notifyService.acceptDemondByDesign(user?.id, form.to, "设计师已经接受您的需求")
        const { email } = await service.getUserEamilByDemandId(result.data.id)
        const mailService = useService("mail", { user, locale })
        await mailService.sendAcceptMail(result.data.id, email);
      }
      return json({ code: ResultCode.OK })
    }
    case 'tobeBegin': {
      const service = useService("demand");
      const currentDate = dayjs();
      const fulltime = currentDate.add(2, 'day');
      await service?.updataTimelineStatus(form.id, TimelineStatus.DESINNERCONFIRMED, fulltime?.toDate())
      const { email } = await useService("designer").getUserEamilByDemandId(form.id)
      const mailService = useService("mail", { user, locale })
      await mailService.sendBeginMail(form.id, email);
      return json({ code: ResultCode.OK })
    }
    case 'commentStatusChange': {
      const service = useService("demand");
      if (form?.demandId !== undefined && form?.status !== undefined) {
        await service.updateCommentStatus(form?.demandId, form?.status)
      }
      return json({ code: ResultCode.OK })
    }
    default: {
      return json({});
    }
  }
}

async function getRequirment (demondId: number) {
  if (!demondId) {
    return json({})
  }
  const service = useService("demand");
  const result = await service.getDemandAttachments(demondId);
  return {
    ...result,
  };
}

export default function Page () {
  const { requirement, code, designerQuotation, fromDesignerFlag } = useLoaderData()
  const mutation = useFetcher()
  const handleReject = (id: number, toUser: number) => {
    mutation.submit({ _action: "statuschange", id, status: 2000, designer_user_id: null, to: toUser }, { method: "post", encType: "application/json" })
  }

  const handleBegin = (id: number, toUser: number) => {
    mutation.submit({ _action: "tobeBegin", id, status: 2000, designer_user_id: null, to: toUser }, { method: "post", encType: "application/json" })
  }
  const handleAccept = (data: {
    id: number;
    // draftTime: Date;
    // complatelTime: Date
    // finalTime: Date,
    toUser: number;
  }) => {
    const {
      id,
      toUser,
      // draftTime,
      // complatelTime,
      // finalTime,
    } = data;
    mutation.submit({ _action: "accept", id, status: 4000, to: toUser }, { method: "post", encType: "application/json" })
  }
  const params = useParams();
  if (code !== ResultCode.OK) {
    return (
      <div className="flex gap-6 bg-base-100 justify-center items-center h-full ">
        <Link to="/dashboard/applydesigner"><button className="btn btn-sm btn-primary">申请平台设计师</button></Link>
      </div>
    )
  }


  const { t } = useTranslation()
  const { pathname } = useLocation()
  const active = useRef("text-primary font-semibold p-2")
  const normal = useRef("text-opacity-60 font-semibold p-2")

  return (
    <div className="flex flex-col gap-4">
      <OperatorHeader title={
        <Link to="/dashboard/designer/orders/all" className="flex gap-1 items-center cursor-pointer" replace={true} prefetch="intent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
          </svg>
          {t("demandorder.detail.title")}
        </Link>
      }><span />
      </OperatorHeader>
      <OrderStatus data={requirement} onAccept={handleAccept} onReject={handleReject} onBegin={handleBegin} />
      <div className="block md:hidden text-xs">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-18 p-0 text-primary">
              {(() => {
                let label = t("demandorder.detail.demandInfo")
                if (pathname.endsWith("demand")) {
                  label = t("demandorder.detail.demandInfo")
                }
                if (pathname.endsWith("quotation")) {
                  label = t("demandorder.detail.quotation")
                }
                if (/.*design*/.test(pathname)) {
                  label = t("demandorder.detail.design")
                }
                if (pathname.endsWith("evaluate")) {
                  label = t("demandorder.detail.comment")
                }
                if (pathname.endsWith("message")) {
                  label = t("demandorder.detail.messageBoard")
                }
                return <div className="flex mx-2 text-xs"><span>{label}</span><ChevronDownIcon className="h-4 w-4" /></div>
              })()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="bg-base-100 w-20">
            <DropdownMenuItem className="text-xs">
              <Link to={`/dashboard/order/${params?.id || ''}/demand`}
                className={pathname.endsWith("demand") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.demandInfo")}
              </Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem className="text-xs">
                    <Link to={`/dashboard/order/${params?.id || ''}/quotation`}
                      className={pathname.endsWith("quotation") ?`${active.current} w-full` : `${normal.current} w-full`}>
                      {t("demandorder.detail.quotation")}
                    </Link>
                  </DropdownMenuItem> */}
            <DropdownMenuItem className="text-xs">
              <Link to={`/dashboard/order/${params?.id || ''}/design/g`}
                className={/.*design*/.test(pathname) ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.design")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to={`/dashboard/order/${params?.id || ''}/evaluate`}
                className={pathname.endsWith("evaluate") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.comment")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Link to={`/dashboard/order/${params?.id || ''}/message`}
                className={pathname.endsWith("message") ? `${active.current} w-full` : `${normal.current} w-full`}>
                {t("demandorder.detail.messageBoard")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="hidden md:flex flex-col justify-between rounded-xl gap-6 text-sm">
        <div className="flex gap-2 justify-left lg:justify-start text-xs md:text-sm">
          <Link to={`/dashboard/order/${params?.id || ''}/demand`}
            className={pathname.endsWith("demand") ? active.current : normal.current}>
            {t("demandorder.detail.demandInfo")}
          </Link>
          {
            (fromDesignerFlag == 'y') ? (
              <Link to={`/dashboard/order/${params?.id || ''}/quotation`}
                className={pathname.endsWith("quotation") ? active.current : normal.current}>
                {t("demandorder.detail.quotation")}
              </Link>
            ) : (
              ''
            )
          }

          <Link to={`/dashboard/order/${params?.id || ''}/design/g`}
            className={/.*design*/.test(pathname) ? active.current : normal.current}>
            {t("demandorder.detail.design")}
          </Link>
          <Link to={`/dashboard/order/${params?.id || ''}/evaluate`}
            className={pathname.endsWith("evaluate") ? active.current : normal.current}>
            {t("demandorder.detail.comment")}
          </Link>
          <Link to={`/dashboard/order/${params?.id || ''}/message`}
            className={pathname.endsWith("message") ? active.current : normal.current}>
            {t("demandorder.detail.messageBoard")}
          </Link>
        </div>
      </div>
      <div className="p-0 rounded-xl bg-base-100">
        <Outlet />
      </div>
    </div>
  )
}