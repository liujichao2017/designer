//@ts-nocheck
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { fromData, Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";
import { changeDesignerValidator, QuotationValidator, UploadWithIdValidator } from "~/utils/validators";
import { useLoaderData } from "react-router";
import { useFetcher } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import UploaderDialog from "~/components/form/UploaderDialog";
import { FileContent } from "~/components/form/Uploader";
import Contact from "~/components/ui/demand/Contact";
import Designer from "~/components/ui/demand/Designer";
import Design from "~/components/ui/demand/Design";
import Printing from "~/components/ui/demand/Printing";
import Preference from "~/components/ui/demand/Preference";
import Quotation from "~/components/ui/demand/Quotation";
import SearchDesignerDialog from "~/components/form/SearchDesignerDialog";
import ResetQuotationDialog from "~/components/form/ResetQuotationDialog";

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const { id } = args.params
  const demandService = useService('demand')
  const pictureService = useService('picture')
  const userService = useService('user')
  const demandDetail = await demandService.getDemand(+id)
  if (!demandDetail) {
    return fault(ResultCode.DATABASE_ERROR)
  }
  demandDetail.pictureList = demandDetail.picture_id ? await pictureService.getPictureListByIds(demandDetail.picture_id) : []
  demandDetail.selectedImages = demandDetail.pictureList
  demandDetail.designer = demandDetail?.designer_user_id ? await userService.getUser(demandDetail.designer_user_id) : {}
  return json({ demandDetail, code: ResultCode.OK, endPoint: process.env.END_POINT })
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
  const { request } = args
  const demandService = useService('demand')
  const userService = useService('user')
  const form = await request.json()
  const { _action } = form
  switch (_action) {
    case 'edit':
      const result = changeDesignerValidator.safeParse(form)
      if (!result.success) return fault(ResultCode.FORM_INVALID)
      await demandService.updateDesignerUserId(parseInt(result.data.id), parseInt(result.data.designerUserId))
      useService("mail", { user }).sendDesignerConfirmMail(result.data.id, result.data.designerUserId)
      return json({ code: ResultCode.OK, designer: await userService.getUser(parseInt(result.data.designerUserId)) })
    case "addQuotation":
      {
        const result = QuotationValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        const data = await demandService.addQuotation(result.data.id, result.data.quotation)
        if (data.code === ResultCode.OK) {
          useService("mail").sendUpgradeQuotationMail(result.data.id)
        }
        return json({ ...data, ts: Date.now() })
      }
    case "addQuotationPdf":
      {
        const result = UploadWithIdValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json({ ...(await demandService.addQuotation(result.data.id, 0, result.data.contents.at(0))), ts: Date.now() })
      }
  }
}

export default function Page () {
  const { demandDetail, code, endPoint } = useLoaderData<typeof loader>()
  if (code !== ResultCode.OK) {
    return <></>
  }
  const [designer, setDesigner] = useState(demandDetail.designer)
  const [demand, setDemand] = useState<ReturnType<typeof fromData>>(null)
  useEffect(() => {
    setDemand(fromData(demandDetail))
  }, [demandDetail])
  const fetcher = useFetcher()
  const mutation = useFetcher()

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && fetcher.data?.code === ResultCode.OK) {
      setDesigner({ ...fetcher.data.designer })
    }
  }, [fetcher])

  const addQuotation = (quotation: number) => {
    mutation.submit({ _action: 'addQuotation', id: demandDetail.id, quotation }, { method: 'post', encType: 'application/json' })
  }

  const addQuotationPdf = useCallback((files: FileContent[]) => {
    mutation.submit({ _action: 'addQuotationPdf', id: demandDetail.id, contents: files.map(val => val.src) }, { method: 'post', encType: 'application/json' })
  }, [])



  return (
    <>
      {
        demand &&
        <div className="grid md:grid-cols-2 grid-cols-1 lg:gap-y-1 gap-y-2 gap-x-10 px-2 pb-48">
          <Contact infomation={{ ...demand.contact }} />
          {
            designer &&
            <Designer
              designer={{ ...demand.designer }}
              callback={() => (window as any)?.selectModal?.showModal()} />
          }

          <Design service={demand.service} design={demand.design} bussiness={demand.bussiness} attach={demand.attachment} />
          {
            print && [0, 2, 3, 4].includes(demand.design?.type ?? -1) && [1, 2].includes(demand.service ?? -1) &&
            <Printing print={demand.print} />
          }

          <Preference images={demand.selectedImages ?? []} addition={demandDetail.addition} />

          <Quotation
            id={demand.id} endPoint={endPoint} ts={mutation.data?.ts ?? 1128}
            level={demand.level} quotation={demand.quotation} pdf={demand.quotation_pdf}
            editQuotation={() => (window as any)?.resetQuotationDialog?.showModal()}
            uploadQuotationPdf={() => (window as any)?.uploaderDialog?.showModal()}
          />

        </div> ||
        <></>
      }
      <SearchDesignerDialog id={demandDetail.id} />
      <ResetQuotationDialog callback={addQuotation} />
      <UploaderDialog allowedTypes={["application/pdf"]} maxItemCount={1} totalSize={1024 * 1024 * 5} upload={addQuotationPdf} />
    </>
  )
  // return (<div>
  //   <div>{t('demand.stepList.0')}</div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.name')}</div>
  //     <div className="text-sm text-slate-500 leading-10">{demandDetail.name}</div>
  //   </div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">Whatsapp</div>
  //     <div className="text-sm text-slate-500 leading-10">{demandDetail.contact_number}</div>
  //   </div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.email')}</div>
  //     <div className="text-sm text-slate-500 leading-10">{demandDetail.email}</div>
  //   </div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.designPicture')}</div>
  //     <div className="text-sm text-slate-500 leading-10">
  //       <div className="flex">
  //         <PhotoProvider>

  //           {demandDetail.pictureList.map((value, index) =>
  //           (
  //             <div className="ml-2.5" key={index}>
  //               <PhotoView src={value.img_url}>
  //                 <img className="h-20 rounded-md object-cover" src={value.litpic_url} />
  //               </PhotoView>
  //             </div>
  //           )
  //           )}
  //         </PhotoProvider>
  //       </div>
  //     </div>
  //   </div>

  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.service')}</div>
  //     <div className="text-sm text-slate-500 leading-10">{t(`demand.servicesItem.${demandDetail.services}`)}</div>
  //   </div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.type')}</div>
  //     <div className="text-sm text-slate-500 leading-10">{t(`demand.typeItem.${demandDetail.type}`)}</div>
  //   </div>
  //   <div className="leading-10">{t('demand.stepList.1')}</div>
  //   {typeDom}
  //   {servicesDom}
  //   <div className="leading-10">{t('demand.stepList.2')}</div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.remark')}</div>
  //     {
  //       demandDetail.remark && demandDetail.remark != "undefined" &&
  //       <div className="text-sm text-slate-500 leading-10">{demandDetail?.remark}</div>
  //     }
  //   </div>
  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.uploadDocument')}</div>
  //     <div className="text-sm text-slate-500 leading-10">
  //       <div className="flex">
  //         {demandDetail.img_list ? JSON.parse(demandDetail.img_list).map((value, index) => {
  //           return (<div className="ml-2.5" key={index}>
  //             <img className="w-16 rounded-md aspect-[4/5]" src={value.litpic_url} />
  //           </div>)
  //         }) : ''}
  //       </div>
  //     </div>
  //   </div>

  //   <div className="flex justify-between">
  //     <div className="text-sm text-slate-500 leading-10">{t('demand.quotation')}</div>
  //     <div className="flex text-sm text-slate-500 leading-10 gap-4">
  //       <span>
  //         {formatMoney(quotation?.totalPrice ?? 0)}
  //       </span>
  //       <span>
  //         {demandDetail.quotation_pdf &&
  //           <a href={demandDetail.quotation_pdf} _target="_blank" className="link link-primary">Quotation PDF</a> ||
  //           (quotation?.price &&
  //             <Link to={`/quotation/pdf/${demandDetail.id}`} _target="_blank" className="link link-primary">Quotation PDF</Link> ||
  //             <></>
  //           )}
  //       </span>
  //     </div>
  //   </div>

  //   {designer && designer.name ? (<div>
  //     <div className="flex justify-between">
  //       <div className="text-sm text-slate-500 leading-10">{t('designer')}</div>
  //       <Link to={"/portfolio/" + designer.id} className="flex items-center">
  //         <img src={designer?.avatar} className="w-10 h-10 rounded-full" />
  //         <p className="ml-2.5 text-sm">{designer?.name}</p>
  //       </Link>
  //     </div>
  //   </div>) : ''}

  //   <div className="flex justify-end py-4 gap-2">
  //     <button className="btn ml-5" onClick={() => {
  //       window.history.back()
  //     }}>{t('demand.back')}
  //     </button>
  //     <Popover>
  //       <PopoverTrigger>
  //         <button className="btn btn-primary">
  //           {t("demand.editQuotation")}
  //         </button>
  //       </PopoverTrigger>
  //       <PopoverContent>
  //         <form className="bg-base-100 rounded-lg shadow-lg border border-base-300" onSubmit={event => {
  //           event.preventDefault()
  //           setPopoverOpen(false)
  //           addQuotation(+quotationRef.current!.value)
  //         }}>
  //           <div className="join p-6">
  //             <input type="number" ref={quotationRef}
  //               min="1" max="99999999" defaultValue={quotation?.totalPrice || 10}
  //               placeholder={t("demand.editQuotation")}
  //               className="input input-bordered input-sm w-48 join-item" />
  //             <button type="submit" className="btn btn-sm btn-primary join-item">{t("ok")}</button>
  //             <button className="btn btn-sm btn-secondary join-item" onClick={() => {
  //               window.uploaderDialog.showModal()
  //             }}>{t("upload")}</button>
  //           </div>
  //         </form>
  //       </PopoverContent>
  //     </Popover>

  //     <UploaderDialog upload={addQuotationPdf} allowedTypes={["application/pdf"]}
  //       maxSize={1024 * 1024 * 15} maxItemCount={1} />

  //     <button className="btn btn-primary" onClick={() => {
  //       query.load('/api/admin/demand?_loader=search&keyword=');
  //       selectModal?.showModal()
  //     }}>{t('demand.selectDesigner')}</button>
  //   </div>


  // </div>)
}