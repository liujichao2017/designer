
import { LoaderArgs, json, redirect, ActionArgs, AppData, SerializeFrom  } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useFetcher, useLocation, useParams} from "@remix-run/react";
import { ResultCode, fault } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { DesignerDetail, EmployerDetail } from "~/components/ui/OrderDesignDetail";
import { IdValidator, RenameValidator, UploadValidator, DemandDocumentValidator, DemandAttachmentValidator, DemandEditAttachmentValidator } from "~/utils/validators"
import { useService } from "~/services/services.server";
import { FileContent } from "~/components/form/Uploader";
import { TimelineStatus } from '@/utils/definition';
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import dayjs from 'dayjs';
import i18next from "~/i18next.server";

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

    return json({ code: ResultCode.OK, designData, nexturl: process.env.V1_END_POINT })
}

export const action = async (args: ActionArgs) => {
    // const form = await args.request.formData()
    const form = await args.request.json()
    const params = args.params;
    const user = await isAuthenticated(args)
    const {
        id
    } =  params;
    if (!user) throw redirect("/auth/signin")
    let locale = await i18next.getLocale(args.request)
    // if (!params.id) throw redirect("/auth/signin")
    switch (form._action) {
        case 'docRename': {
            const service = useService("project", { user })
            const result = await RenameValidator.safeParse(form)
            if (!result.success) {
                return fault(ResultCode.FORM_INVALID)
            }
            return await service.renameBook(result.data.id, result.data.name)
            // return getDesign(params.id || '', user)
        }
        case 'docDelete': {
            const service = useService("project", { user })
            const result = await IdValidator.safeParse(form)
            if (!result.success) return fault(ResultCode.FORM_INVALID)
            return await service.removeBook(result.data.id)
            // return getDesign(params.id || '', user)
        }
        case 'docUpload': {
            const service = useService("project", { user })
            const result = await UploadValidator.safeParseAsync(form)
            if (!result.success) {
              return fault(ResultCode.FORM_INVALID)
            }
            if(form.projectId) {     
                if (form.count == 0) {
                    const { email } = await useService('designer').getUserEamilByDemandId(parseInt(id, 10))
                    useService("mail", { user, locale}).sendDraftMail(parseInt(id, 10), email);
                }
                return await service.uploadBook(form.projectId, user.id, result.data.contents, form.type)
            }
            
            return fault(ResultCode.FORM_INVALID)
        }
        case 'addSource': {      
            const result = await DemandAttachmentValidator.safeParse(form)
            if (!result.success) {
              return fault(ResultCode.FORM_INVALID)
            }
            return createAttachments(parseInt(params.id, 10), result.data.name, result.data.link)
        }
        case 'editSource': {
            const result = await DemandEditAttachmentValidator.safeParse(form)
            if (!result.success) {
              return fault(ResultCode.FORM_INVALID)
            }
            return editAttachments(result.data.id, result.data.name, result.data.link)
        }
        case 'delSource': {
            return delAttachments(parseInt(form.id))
        }
        case 'completeChange' : {
            const user = await isAuthenticated(args)
            const { email } = await useService('designer').getUserEamilByDemandId(parseInt(id, 10))
            useService("mail", { user, locale }).sendComplateMail(parseInt(id, 10), email, form.status);
            return await completeStatusChange(parseInt(params.id, 10), form.status, form.page,user, form.toUserId, form.type)
        }
        case 'delEmpSource': {
            return delEmpAttachments(parseInt(form.id))
        }
        case 'upload': {
            if (id) {
                await useService("demand").uploadEmployerFiles(form.files, parseInt(id));
            }
            return json({
               code: ResultCode.OK
            })
        }
        default: {
            return json({ name: "JANA", status: 0 });
        }
    }
}
async function delEmpAttachments(id: number) {
    const service = useService("demand");
    await service.delEmpAttachment(id)
    return json({ code: ResultCode.OK })
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
        documents: result?.project?.books ?? [],
        attachments: result?.attachments ?? [],
        empfile_list: result?.empfile_list ?? [],
    }
}

async function createAttachments(id: number, name: string, link: string) {
    const service = useService("demand");
    await service.createAttachments(name,link, id)
    return json({ code: ResultCode.OK })
}
async function editAttachments(id: number, name: string, link: string) {
    const service = useService("demand");
    await service.updateAttachments(id, name,link)
    return json({ code: ResultCode.OK })
}
async function delAttachments(id: number) {
    const service = useService("demand");
    await service.delAttachment(id)
    return json({ code: ResultCode.OK })
}

async function completeStatusChange(id: number,status:number, page: number, user: any, toUserId: number, type: number) {
    const service = useService("demand");
    const notifyService = useService("notify");
    const p = page== undefined || page == 0 ? 100: page

    let compage = Math.floor((p-1)/10) + 2
    if (p > 100) {
        compage = -1
    }
    if([1,3].indexOf(type) > -1 || type >= 5)  {
        compage = 2
    }
    const currentDate = dayjs();
    const fulltime = currentDate.add(2, 'day');
    let finishedTime;
    if (compage !==-1) {
        finishedTime = currentDate.add(compage, 'day').format('YYYY-MM-DD')
    } else {
        finishedTime = `${currentDate.add(12, 'day').format('YYYY-MM-DD')} ~ ${currentDate.add(15, 'day').format('YYYY-MM-DD')}`
    }
    if (status == TimelineStatus.DESINNERCONFIRMED) {
        await service?.updataTimelineStatus(id, status, fulltime?.toDate())
    } else if (status == TimelineStatus.FINISHEDDAFT)  {
        await service?.updataTimelineStatus(id, status, undefined, finishedTime)
    } else {
        await service?.updataTimelineStatus(id, status, undefined, undefined,false)
        // 发送消息
        if (user) {
            await notifyService.acceptDemondByDesign(user.id,toUserId,"设计师已经接受您的需求")
        }
    }

    return json({ code: ResultCode.OK })
}

export default function Page () {
    const { designData, code, nexturl } = useLoaderData()
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const active = useRef("text-primary border-b-2 border-primary font-semibold p-2")
    const normal = useRef("text-opacity-60 font-semibold p-2")
    const params = useParams();
    const mutation = useFetcher()
    const uploadMutation = useFetcher()
    const handleRename = (id: number, name: string) => {
        mutation.submit({ _action: "docRename", id, name}, { method: "post", encType: "application/json"  })
    }
    
    const handleDelete = (id: number) => {
        mutation.submit({ _action: "docDelete", id}, { method: "post", encType: "application/json" })
    }
    
    const handleUpload = (projectId: string | number | undefined, files: FileContent[], type: number) => {
        mutation.submit({ _action: "docUpload", projectId: projectId || '', contents: files.map(d => d.src), type, count: designData?.documents.filter(item => item.type == type)?.length || 0}, { method: "post", encType: "application/json" })
    }

    const handleAddSource = (name: string, link: string) => {
        mutation.submit({ _action: "addSource", name, link, id: 0}, { method: "post", encType: "application/json" })
    }
    const handleDelSource = (id: number) => {
        mutation.submit({ _action: "delSource", id}, { method: "post", encType: "application/json" })
    }
    const handleEditSource = (id: number, name: string, link: string) => {
        mutation.submit({ _action: "editSource", name, link, id}, { method: "post", encType: "application/json" })
    }
    const handleCompleteChange = (status: number, toUserId: number) => {
        mutation.submit({ _action: "completeChange", status, page: designData.page, toUserId, type: designData.type}, { method: "post", encType: "application/json" })
    }
    const handleUploadChange = (files: FileContent[]) => {
        if (files.length > 0) {
            uploadMutation.submit({ _action: "upload", files}, { method: "post", encType: "application/json" })
        }
    }
    const handlEmployDelSource = (id: number) => {
        mutation.submit({ _action: "delEmpSource", id}, { method: "post", encType: "application/json" })
    }
    return (
        <>
          {pathname.endsWith("d") &&  <DesignerDetail
                data={designData}
                nexturl={nexturl}
                upload={handleUpload}
                onDocDelete={handleDelete}
                onRename={handleRename}
                onAddSource={handleAddSource}
                onDelSource={handleDelSource}
                onEditSource={handleEditSource}
                onCompleteChange={handleCompleteChange}
            />}
            {pathname.endsWith("g") && <EmployerDetail
                data={designData}
                employerLoading={uploadMutation.state === 'loading' || uploadMutation.state =='submitting'}
                onAddSource={handleAddSource}
                onDelSource={handleDelSource}
                onEditSource={handleEditSource}
                uploaderChange={handleUploadChange}
                onEmployDelSource={handlEmployDelSource}
            />}
        </>
    )
}