import { useLoaderData, useFetcher, useSearchParams, useLocation } from "@remix-run/react";
import { EvaluateDetail } from "~/components/ui/OrderDetail";
import { isAuthenticated } from "~/utils/sessions.server";
import { ActionArgs, AppData, json, LoaderArgs, redirect, SerializeFrom } from "@remix-run/node";
import { fault, ResultCode } from "~/utils/result";
import { useService } from "~/services/services.server";
import { OrderItems } from '~/components/ui/OrderItems';
import { DemandStatusValidator, DemandStatusChangeValidator } from "~/utils/validators"
import i18next from "~/i18next.server";

export async function loader (args: LoaderArgs) {
  const {
    request,
    params,
  } = args;
  const { searchParams, pathname } = new URL(request.url)
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const url = new URL(request.url)
  const page = searchParams?.get('page');
  const currentPage = page != null && page != undefined ? parseInt(page, 10) : 1;
  const take = 10 as number
  const skip = (currentPage - 1) * take
  const typeMap: { [key: string]: boolean } = {
    '-1': pathname.endsWith("all"),
    '3000': pathname.endsWith("pending"),
    '4000': pathname.endsWith("processing"),
    '5000': pathname.endsWith("voided"),
    '6000': pathname.endsWith("evaluated"),
    '7000': pathname.endsWith("finished"),

  }
  const type = Object.keys(typeMap).find((key: number | string) => typeMap?.[key] == true) || '-1'
  const demandList = await getDemandListByUser(user.id, take, skip, type == '-1' ? undefined : parseInt(type, 10))
  const totalPage = await getADemandListByUserTotalPages(user.id, take, type == '-1' ? undefined : parseInt(type, 10))
  return json({ demandList, totalPage, currentPage, code: ResultCode.OK })
}

export const action = async (args: ActionArgs) => {
  const form = await args.request.json()
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  let locale = await i18next.getLocale(args.request)
  const notifyService = useService("notify", { user });
  switch (form._action) {
    case 'statuschange': {
      const service = useService("designer");
      const demandservice = useService("demand");
      const result = await DemandStatusChangeValidator.safeParse(form)
      if (!result.success) return fault(ResultCode.FORM_INVALID)
      await service.rejectDemand(result.data.id, result.data.status, undefined)

      if (user) {
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
        await service.acceptDemand(result.data.id, result.data.status, project.project?.id, result.data.designer_user_id)
        await notifyService.acceptDemondByDesign(user?.id, form.to, "设计师已经接受您的需求")
        const { email } = await service.getUserEamilByDemandId(result.data.id)
        const mailService = useService("mail", { user, locale })
        await mailService.sendAcceptMail(result.data.id, email);
      }
      return json({ code: ResultCode.OK })
    }
    default: {
      return json({});
    }
  }
}


async function getDemandListByUser (id: number, take: number, skip: number, type?: number) {
  const service = useService("designer");
  const result = await service.getDemandListByUser(id, take, skip, type);
  return result;
}


async function getADemandListByUserTotalPages (id: number, take: number, type?: number) {
  const service = useService("designer");
  const result = await service.getADemandListByUserTotalPages(id, take, type);
  return result;
}

export default function Page () {
  const mutation = useFetcher()
  const loadData = useLoaderData<typeof loader>();
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams();
  const handleReject = (id: number, toUser: number) => {
    mutation.submit({ _action: "statuschange", id, status: 2000, designer_user_id: '', to: toUser }, { method: "post", encType: "application/json" })
  }
  const handleAccept = (data: {
    id: number,
    toUser: number,
    // draftTime: Date;
    // complatelTime: Date
    // finalTime: Date,
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
  return (
    <OrderItems
      data={loadData?.demandList || []}
      onAccept={handleAccept}
      onReject={handleReject}
      currentPage={loadData.currentPage}
      total={loadData.totalPage}
      onPageChange={(pageIndex: number) => {
        const sp = new URLSearchParams(searchParams.toString())
        sp.set("page", pageIndex.toString())
        return `${pathname}?${sp.toString()}`;
      }} />
  )
}