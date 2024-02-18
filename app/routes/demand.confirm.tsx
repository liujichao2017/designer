//@ts-nocheck
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { useNavigate, useSearchParams, useFetcher, useLoaderData } from "@remix-run/react";
import { createHash } from "crypto";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { useService } from "~/services/services.server";
import { decrypto } from "~/utils/crypto.server";
import { ResultCode, fault } from "~/utils/result";
import { UserProps, useDemandState } from "~/utils/store";
import { uploadImages } from "~/utils/upload.server";
import { DemandValidator } from "~/utils/validators";
import { FileContent } from "~/components/form/Uploader";
import { GlobalLoading, Loading } from "~/components/ui/Loading";
import Contact from "~/components/ui/demand/Contact";
import Designer from "~/components/ui/demand/Designer";
import Design from "~/components/ui/demand/Design";
import Printing from "~/components/ui/demand/Printing";
import Preference from "~/components/ui/demand/Preference";
import Quotation from "~/components/ui/demand/Quotation";
import { categoryMapper } from "~/utils/definition";
import { sleep } from "~/utils/helpers";

export async function loader ({ request }: LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const _loader = searchParams.get("loader")
  // console.log("designerId", searchParams.get("designerId") ?? '')
  // console.log("fromDesigner", searchParams.get("fromDesigner") ?? '')
  const fromDesignerFlag = searchParams.get("fromDesigner") ?? '' //fromDesignerFlag-y表示设计师创建的订单
  const designerId = searchParams.get("designerId") ?? ''

  if (_loader === "quotation" && fromDesignerFlag != 'y') {
    const pictures = searchParams.get("pictures")?.split(",").map(val => +val) ?? []
    const type = searchParams.get("type") ?? -1
    const pages = searchParams.get("pages") ?? 0
    const size = searchParams.get("size") ?? -1
    const sv = searchParams.get("service") ?? 0
    const suite = searchParams.get("suite") ?? 0
    const service = useService("demand")
    const level = await service.getQuotationLevelPlain(pictures)
    return json({ level, quotation: service.getQuotationPlain(+type, +pages, +size, level, +sv, +suite) })
  }
  let fromDesigner = null
  let defaultDesigner = null
  if (fromDesignerFlag != 'y') {
    defaultDesigner = await useService("user").getUserByEmail("hobbyland.designer@gmail.com")
  }
  else if (fromDesignerFlag == 'y' && designerId && parseInt(designerId) > 0) {
    fromDesigner = await useService("user").getUser(parseInt(designerId))
  }
  else {

  }
  // console.log("fromDesigner", fromDesigner)
  return json({ defaultDesigner, fromDesigner, fromDesignerFlag, endPoint: process.env.END_POINT })
}

export async function action ({ request }: ActionArgs) {
  const form = await request.formData()
  // console.log("createDemand-form-before", Object.fromEntries(form) )
  const result = DemandValidator.safeParse(Object.fromEntries(form))
  if (!result.success) {
    return fault(ResultCode.FORM_INVALID)
  }
  // const formData = Object.fromEntries(form)
  // console.log("createDemand-form-formData", formData )

  // console.log("createDemand-form-result", result )

  const { searchParams } = new URL(request.url)
  const service = useService("demand")

  const hash = createHash("md5").update(form.get("sid") ?? "").digest("hex")

  const d = await service.getDemandByHash(hash)
  if (d) {
    return redirect("/demand/result?" + searchParams.toString())
  }
  const shareUser = decrypto(form.get("sid") ?? "")
  result.data.share_user_id = shareUser.id ? Number(shareUser.id as unknown as string) : 0

  if (result.data.img_list) {
    const img = JSON.parse(result.data.img_list)
    const images = await uploadImages(img)
    result.data.img_list = JSON.stringify(images?.map(val => ({
      thumbnail: val.thumbnailUrl,
      image: val.url
    })))
  }

  if (result.data.bussiness_card) {
    let bussiness = JSON.parse(result.data.bussiness_card)
    let images: string[] = []

    if (bussiness?.backSide?.attachments) {
      images = (await uploadImages(bussiness.backSide.attachments.map((val: FileContent) => val.src), console.log, false))?.map(val => val.url)

    }

    const nb = {
      ...bussiness, backSide: {
        ...bussiness.backSide, attachments: bussiness.backSide?.attachments?.map((val, index) => {
          return { ...val, src: images.at(index) }
        })
      }
    }
    result.data.bussiness_card = JSON.stringify(nb)
  }
  // console.log("createDemand-form", form )
  // console.log("createDemand", { ...result.data, link: hash } )
  const demand =
    await service.createDemand({ ...result.data, link: hash })
  // console.log("createDemand-result-demand", demand )
  if (demand.from_designer_flag != "y") {
    //@ts-ignore
    // const level = await service.getQuotationLevel(demand)
    //@ts-ignore
    // const level = await service.getQuotationLevel(demand)
    // //@ts-ignore
    // const quotation = service.getQuotations(demand, level ? +level : 4)

    // if (quotation && quotation.price && quotation.totalPrice) {
    //   const buf = await fetch(`${process.env.END_POINT}/quotation/pdf/${demand.id}`).then(resp => resp.arrayBuffer())
    //   const base64 = "data:application/pdf;base64, " + Buffer.from(buf).toString("base64")
    //   await service.addQuotation(demand.id, quotation.totalPrice, base64, quotation.discount)
    // }
  }

  if (demand) {
    const mail = useService("mail")
    mail.sendDemandMail(demand.id)
    mail.sendUnquotedAdminMail(demand.id)
  }

  if (demand.from_designer_flag && demand.from_designer_flag == "y") {
    return redirect("/demand/result?" + searchParams.toString())
  }
  return json({ code: ResultCode.OK })
}

export default function Page () {
  const { defaultDesigner, fromDesigner, fromDesignerFlag, endPoint } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const reset = useDemandState(s => s.reset)

  // console.log("fromDesigner", fromDesigner)
  const [contact, service, design, print, attach, images, designer, id, bussiness, setDesigner] =
    useStore(useDemandState, state =>
      [state.contact, state.service, state.design, state.print, state.attachment,
      state.selectedImages, state.designer, state.id, state.bussiness,
      state.setDesigner]
    )

  const mutation = useFetcher()
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [searchParams, _] = useSearchParams()
  // console.log("searchParams-fromDesigner", searchParams.get("fromDesigner"))
  // const fromDesigner = searchParams.get("fromDesigner") ?? ''
  // const designerId = searchParams.get("designerId") ?? ''
  // useEffect(() => {
  //   if (fromDesigner) {
  //     setDesigner(fromDesigner as UserProps)
  //   }
  // }, [])

  useEffect(() => {
    if (design?.type === 3 && defaultDesigner && fromDesignerFlag != 'y') {
      setDesigner(defaultDesigner as UserProps)
    }
    if (fromDesigner) {
      setDesigner(fromDesigner as UserProps)
    }
    fetcher.load(`/demand/confirm?loader=quotation&pictures=${images.map(val => val.id).join(",")}&type=${design?.type}&pages=${design?.pages}&size=${design?.size}&service=${service}&suite=${design?.suite ?? -1}&t=${Date.now()}`)

  }, [])

  const submit = useCallback(() => {
    const data = {
      sid: searchParams.get("sid") ?? "",
      designer_user_id: (fromDesignerFlag != 'y') ? (designer?.id ?? 0) : (fromDesigner.id ?? 0),
      platform: searchParams.get("platform") ? +searchParams.get("platform") : 1,
      services: service,
      type: design?.type ?? -99,
      from_designer_flag: fromDesignerFlag,
      //@ts-ignore
      name: contact?.name,
      email: contact?.email,
      contact_number: contact?.whatsapp, //whatsapp

      size: design?.size,
      page: design?.pages,
      category: design?.category,
      logo_design: design?.logoSummary ?? "",
      logo_type: design?.logo,
      folding: design?.foldingType,

      suite: design?.suite ?? -1,

      final_delivery_time: design?.final_delivery_time,

      printing_number: print?.quality, //quality
      printing_page: print?.pages,
      printing_size: print?.size,
      cover_paper: print?.coverPaper,
      inner_paper: print?.innerPaper,
      staple: print?.bindingType,
      finish: print?.finishOptions ? JSON.stringify(print?.finishOptions) : "",

      remark: attach?.remark ?? "",
      img_list: JSON.stringify(attach?.images?.map(val => val.src)) ?? "[]",
      attach_link: attach?.link ?? "",

      picture_id: JSON.stringify(images.map(val => val.id)),

      bussiness_card: JSON.stringify(bussiness ?? "")
    }
    const payload = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== null && value !== undefined))
    // return console.log("payload", payload)
    //@ts-ignore

    // console.log("payload", payload)
    mutation.submit(payload, { method: "post" })
  }, [])

  const gotoDesignerPage = useCallback(() => {
    const sp = new URLSearchParams(searchParams)
    sp.set("p", "1")
    sp.set("c", (categoryMapper.get(design?.type + "") ?? "-1") + "")
    sp.set("ids", images.map(v => v.id).join(","))
    navigate("/demand/designer?" + sp.toString())
  }, [images, design, searchParams])


  return (
    <div className="w-full">
      <GlobalLoading />
      <div className="bg-base-200 py-10 lg:px-[18rem] px-6 relative">
        <div className="text-lg font-semibold">{t("requirementSlogin.11")}</div>
        <div className="mt-5">
          <p className="text-[#86868B]">{t("requirementSlogin.12")}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 grid-cols-1 lg:gap-y-1 gap-y-2 gap-x-10 lg:px-[18rem] md:px-[8rem] px-4 pb-40 pt-8">
        <Contact infomation={{ ...contact }} />
        {
          designer && [0, 1].includes(service ?? -1) &&
          <Designer
            designer={{ ...designer }}
            hiddenButton={design.type === 3 || fromDesignerFlag == 'y'}
            callback={() => gotoDesignerPage()} />
        }
        {
          [0, 1].includes(service ?? -1) &&
          <Design service={service} design={design} bussiness={bussiness} attach={attach} />
        }
        {
          print && [0, 2, 3, 4].includes(design?.type ?? -1) && [1, 2].includes(service ?? -1) &&
          <Printing print={print} />
        }

        {
          [0, 1].includes(service ?? -1) &&
          <Preference images={images.map((val, i) => ({ ...val, id: i }))} />
        }
        {
          // fromDesignerFlag == '' ? (fetcher.state === "loading" && <Loading /> ||
          //   <Quotation
          //     endPoint={endPoint}
          //     params={{
          //       type: design?.type,
          //       service,
          //       pages: design?.pages,
          //       suite: design?.suite,
          //       pictures: images.map(v => v.id),
          //       size: design?.size
          //     }} />) : ''
        }
      </div>

      <div
        className="fixed z-[999] bg-base-100 left-0 right-0 bottom-0 px-5 h-20 flex justify-between items-center shadow-[0px_-6px_12px_0px_rgba(52,92,160,0.05)]">
        <div></div>
        <div className="flex">
          <a className="border-2 border-[#dcdcdc] text-[#565656] rounded-lg px-5 h-10 leading-10 cursor-pointer"
            onClick={() => {
              if (design?.type === 3) {
                return navigate("/demand/style?" + searchParams.toString())

              }
              // const sp = new URLSearchParams(searchParams)
              // sp.set("p", "1")
              // sp.set("c", (categoryMapper.get(design?.type) ?? -1) + "")
              // sp.set("ids", images.map(v => v.id).join(","))
              // navigate("/demand/designer?" + sp.toString())
              // gotoDesignerPage()
              // navigate(-1)

              if (fromDesignerFlag != 'y') {
                // gotoDesignerPage()
                navigate(-1)
              }
              else {
                return navigate("/demand/style?" + searchParams.toString())
              }
            }}>{t("demand.back")}</a>
          <button
            className="bg-[#2F4CDD] rounded-lg px-5 h-10 leading-10 text-white cursor-pointer ml-5"
            onClick={submit}>{fromDesignerFlag != 'y' ? t("demand.getQuotation") : t("demand.submitRequirement")}
          </button>
        </div>
      </div>
    </div>
  )
}
