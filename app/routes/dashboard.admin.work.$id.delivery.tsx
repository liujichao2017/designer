
import { LoaderArgs, json, redirect, ActionArgs, AppData, SerializeFrom  } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useFetcher, useLocation, useParams} from "@remix-run/react";
import { ResultCode, fault } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { DesignerDetail, DesignerTimeLine } from "~/components/ui/OrderDesignDetail";
import { IdValidator, RenameValidator, UploadValidator, DemandDocumentValidator, DemandAttachmentValidator, DemandEditAttachmentValidator } from "~/utils/validators"
import { useService } from "~/services/services.server";
import { FileContent } from "~/components/form/Uploader";
import { useRef } from "react";
import { DemandStatus} from '@/utils/definition'
import { useTranslation } from "react-i18next";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "~/components/ui/Tooltip"

export async function loader (args: LoaderArgs) {
    const {
        request,
        params,
    } = args;
    const user = await isAuthenticated(args)
    if (!user) throw redirect("/auth/signin")

    const isDesigner = await hasRole(Roles.PRO, args)
    if (!isDesigner) return json({ code: ResultCode.PERMISSION_DENIED, designData: undefined })
    const {
        id
    } =  params;
    let designData = {};
    if (id) {
        designData = await getDesign(Number.parseInt(id, 10))
    }

    return json({ code: ResultCode.OK, designData })
}


async function getDesign(demondId: number) {
    if(!demondId) {
        return {}
    }
    const service = useService("demand");
    const result = await service.getDemandDesign(demondId)
    return {
        ...result,
        projectId: result?.project?.id,
        documents: result?.project?.books || [],
        attachments: result?.attachments || [],
    }
}

export default function Page () {
    const { designData, code } = useLoaderData()
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const active = useRef("text-primary border-b-2 border-primary font-semibold p-2")
    const normal = useRef("text-opacity-60 font-semibold p-2")
    const params = useParams();
    console.log('designData?.status > DemandStatus.unreception', designData?.status > DemandStatus.unreception)
    return (
        <>
            <DesignerTimeLine data={designData}/>
            <div className="h-[20px] bg-base-200/60"></div>
            <div className="grid grid-cols-1 gap-4 bg-base-100 md:rounded-md w-full p-4">
                <div className="flex items-center justify-between"><div>文件夹</div></div>
                <div className="flex gap-12 justify-left lg:justify-start text-sm">
                    <Link to={`/dashboard/admin/work/${params?.id || ''}/delivery/g`}
                        className={pathname.endsWith("g") ? active.current : normal.current}>
                         {t('demandorder.emp')}
                    </Link>
                    <Link to={designData?.status > DemandStatus.unreception  ? `/dashboard/admin/work/${params?.id || ''}/delivery/d`: `/dashboard/admin/work/${params?.id || ''}/delivery/g`}
                        className={pathname.endsWith("d") ? active.current : normal.current}>
                        {t('demandorder.design')}
                    </Link>
                </div>
                <Outlet />
            </div>
        </>
    )
}