import { FormEvent, useEffect, useState, useTransition } from "react";
import { useAppearanceStore, useDemandState } from "~/utils/store";
import { Link, useNavigate, useSearchParams } from "@remix-run/react";

import { useTranslation } from "react-i18next";
import { formatBytes, range } from "~/utils/helpers";
import UploaderDialog from "../UploaderDialog";
import LogoType from "~/components/ui/demand/LogoType";
import FlyersType from "~/components/ui/demand/FlyersType";
import CardType from "~/components/ui/demand/CardType";
import PaintingType from "~/components/ui/demand/PaintingType";
import Datepicker from "react-tailwindcss-datepicker";
import dayjs, { Dayjs } from "dayjs";
import { categoryMapper } from "~/utils/definition"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/Tooltip";

function getDeliveryDate (pages: number, isLogo: boolean = false) {
  if (isLogo) return 10
  const d = Math.ceil(pages / 10) + 3
  return d < 17 ? d : 17
}

const cardPrintText = `紙質:啞粉300g
數量:300 
`

export default function () {
  const { t } = useTranslation()
  const lang = useAppearanceStore(state => state.lang)
  const [errors, setErrors] = useState<Record<string, string>>()
  const [, startTransition] = useTransition()
  const [searchParams,] = useSearchParams()
  const navigate = useNavigate()
  const [deliveryDate, setDeliveryDate] = useState<Dayjs>(dayjs().add(3, "day"))
  const [service, setService, contact, platform] = useDemandState(state => [state.service, state.setService, state.contact, state.platform])

  // console.log("searchParams-mine",searchParams.get("fromDesigner"))
  const fromDesigner = searchParams.get("fromDesigner") ?? ''

  useEffect(() => {
    setDesignOption({
      ...designOption, final_delivery_time: deliveryDate.toISOString()
    })
    if (!contact) {
      navigate("/demand/requirement?" + searchParams.toString())
    }
  }, [])
  const [designOption, setDesignOption, resetDesignOption] = useDemandState(state => [state.design, state.setDesignOption, state.resetDesignOption])
  const [printOption, setPrintOption, resetPrintOption] = useDemandState(state => [state.print, state.setPrintOption, state.resetPrintOption])
  const [bussiness, setBussiness, resetBussiness] = useDemandState(state => [state.bussiness, state.setBussiness, state.resetBussiness])
  const [attach, setAttach, resetAttach] = useDemandState(state => [state.attachment, state.setAttachmentOption, state.resetAttachmentOption])

  // useEffect(() => {
  //   const now = dayjs()
  //   const delivery = (designOption?.type === 3) ?
  //     now.add(3, "day") :
  //     now.add(getDeliveryDate(designOption?.pages ?? 0, designOption?.type === 1), "day")

  //   setDeliveryDate(delivery)
  //   setDesignOption({
  //     ...designOption,
  //     final_delivery_time: delivery.toISOString()
  //   })
  // }, [designOption?.pages, designOption?.type])

  useEffect(() => {
    if (designOption?.type === 3) {
      const cardDeliveryDate = dayjs().add(3, "day")
      setDesignOption({
        ...designOption,
        final_delivery_time: cardDeliveryDate.toISOString()
      })
      setDeliveryDate(cardDeliveryDate)
    }
  }, [designOption?.type])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let hasError = false
    if (service === undefined || service < 0) {
      setErrors(prev => ({ ...prev, ...{ service: t("prompt.required") } }))
      hasError = true
    }
    if (service !== 2 && designOption?.type === undefined) {
      setErrors(prev => ({ ...prev, ...{ designType: t("prompt.required") } }))
      hasError = true
    }

    if ([0, 1].includes(service ?? -1)) {
      if (designOption?.type === 0) {
        if (designOption.category === undefined) {
          setErrors(prev => ({ ...prev, ...{ category: t("prompt.required") } }))
          hasError = true
        }
        if (designOption.size === undefined) {
          setErrors(prev => ({ ...prev, ...{ size: t("prompt.required") } }))
          hasError = true
        }
      }
      if (designOption?.type === 1) {
        if (designOption.logoSummary === undefined) {
          // setErrors(prev => ({ ...prev, ...{ logoSummary: t("prompt.required") } }))
          // hasError = true
        }

        if (designOption.logo === undefined) {
          setErrors(prev => ({ ...prev, ...{ logo: t("prompt.required") } }))
          hasError = true
        }
      }
      if (designOption?.type === 2) {
        if (designOption.size === undefined) {
          setErrors(prev => ({ ...prev, ...{ size: t("prompt.required") } }))
          hasError = true
        }
        if (designOption.foldingType === undefined) {
          setErrors(prev => ({ ...prev, ...{ foldingType: t("prompt.required") } }))
          hasError = true
        }
      }
      if (designOption?.type === 3 && (service == 0 || service == 1)) {
        if (bussiness?.lang === undefined || bussiness.lang < 0) {
          setErrors(prev => ({ ...prev, ...{ cardLang: t("prompt.required") } }))
          hasError = true
        }
        if (bussiness?.style === undefined || Number.isNaN(bussiness?.style) || bussiness.style < 0) {
          setErrors(prev => ({ ...prev, ...{ cardStyle: t("prompt.required") } }))
          hasError = true
        }
        if (bussiness?.size === undefined || bussiness.size < 0) {
          setErrors(prev => ({ ...prev, ...{ cardSize: t("prompt.required") } }))
          hasError = true
        }
        if (bussiness?.direct === undefined || bussiness.direct < 0) {
          setErrors(prev => ({ ...prev, ...{ cardDirect: t("prompt.required") } }))
          hasError = true
        }
        // if (!bussiness?.frontSide?.desc) {
        //   setErrors(prev => ({ ...prev, ...{ frontSide: t("prompt.required") } }))
        //   hasError = true
        // }
      }
    }

    if (service === 1 || service === 2) {
      if (designOption?.type !== 3) {
        if (printOption?.size === undefined) {
          setErrors(prev => ({ ...prev, ...{ printSize: t("prompt.required") } }))
          hasError = true
        }

        if (printOption?.coverPaper === undefined) {
          setErrors(prev => ({ ...prev, ...{ coverPaper: t("prompt.required") } }))
          hasError = true
        }

        if (printOption?.innerPaper === undefined) {
          setErrors(prev => ({ ...prev, ...{ innerPaper: t("prompt.required") } }))
          hasError = true
        }

        if (printOption?.bindingType === undefined) {
          setErrors(prev => ({ ...prev, ...{ bindingType: t("prompt.required") } }))
          hasError = true
        }

        if (printOption?.finishOptions === undefined) {
          setErrors(prev => ({ ...prev, ...{ finishOptions: t("prompt.required") } }))
          hasError = true
        }
      }
    }
    if (designOption?.final_delivery_time === undefined) {
      setErrors(prev => ({ ...prev, ...{ date: t("prompt.required") } }))
      hasError = true
    }

    console.log(hasError, errors)
    if (!hasError) {
      if (service === 2) return navigate("/demand/confirm?" + searchParams.toString())

      const c = categoryMapper.get(designOption?.type + "" ?? "") ?? "-1"
      const query = new URLSearchParams(searchParams)
      if (c) query.set("c", c + "")

      navigate("/demand/style?" + query.toString())
    }
  }

  return (<div>
    <form onSubmit={handleSubmit} >
      <div className="bg-base-200 py-5 lg:px-[18rem] px-6 relative">
        <div className="flex items-center">
          <div onClick={() => {
            navigate(-1)
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
              stroke="currentColor" className="w-4 h-4 stroke-[#86868B]">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
            </svg>
          </div>
          <Link to={"/demandCreator?platform=" + platform} className="text-[#86868B] text-sm ml-2.5 leading-5">{t("requirementSlogin.2")}</Link>
        </div>
        <div className="text-lg font-semibold leading-5">{t("requirementSlogin.4")}</div>
        <div>
          <p className="text-[#86868B] text-sm leading-5">{t("requirementSlogin.5")}</p>
        </div>
      </div>
      <div className="py-10 lg:px-[18rem] px-4 pb-[6.5rem] flex justify-between flex-wrap lg:gap-10 ">
        <div className="flex flex-col xl:w-[calc(50%-1.25rem)] w-full">
          <div className="pb-2.5">
            <div>{t("demand.designTitle")}</div>
            <div className="flex justify-between items-center">
              <div className="mt-2.5">
                <span className="text-sm text-[#FF3D00]">*</span>
                <span className="text-sm ml-2.5">{t('demand.type')}</span>
              </div>
              <div
                className="text-red-500"></div>
            </div>
            <div className="mt-2.5">
              <select
                className={`rounded-lg border ${errors?.designType ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
                onChange={(e) => {
                  const type = parseInt(e.target.value)
                  resetDesignOption()
                  resetPrintOption()
                  resetBussiness()
                  setDesignOption({
                    type
                  })
                  setService(0)
                  setErrors({})
                }}>
                <option value={-1}>{t(`demand.type`)}</option>
                {range(13).map((value, index) => {
                  return (<option key={index} selected={value == designOption?.type}
                    value={value}>{t(`demand.typeItem.${value}`)}</option>)
                })}
              </select>
            </div>
            {(designOption?.type ?? -1) > -1 ? (<div>
              <div className="flex justify-between items-center">
                <div className="mt-2.5">
                  <span className="text-sm text-[#FF3D00]">*</span>
                  <span className="text-sm ml-2.5">{t("demand.services")}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-2.5 gap-y-2.5 mt-2.5">
                {
                  (fromDesigner == 'y' ? [0] : [0, 1, 2]).map((value) => {
                    let radioStyle = ""
                    switch (value) {
                      case 0:
                        break
                      case 1:
                        radioStyle = ![0, 2, 3, 4].includes(designOption?.type ?? -1) ? "hidden" : ""
                        break
                      case 2:
                        radioStyle = ![0, 2, 4].includes(designOption?.type ?? -1) ? "hidden" : ""
                        break
                    }
                    return (<div className="flex items-center">
                      <span>
                        <input type="radio" name="services" id={"service" + value}
                          className={`radio ${errors?.service ? 'radio-error' : 'radio-primary'} radio-xs ${radioStyle}`}
                          defaultValue={value}
                          checked={value == service}
                          onChange={(e) => {
                            const service = parseInt(e.target.value)
                            setService(service)
                            if ([1, 2].includes(service) && designOption?.type === 3) {
                              setPrintOption({
                                quality: 300,
                                coverPaper: 4,
                              })
                            }
                            setErrors({})
                          }} />
                      </span>
                      <label className={`ml-2.5 cursor-pointer ${radioStyle}`} htmlFor={"service" + value}>{t(`demand.servicesItem.${value}`)}</label>
                    </div>)

                  })}
              </div>
            </div>) : ''}
            {service == 0 || service == 1 ? (<div>
              {designOption?.type == 0 && <PaintingType errors={errors} setErrors={setErrors} />}
              {designOption?.type == 1 && <LogoType errors={errors} setErrors={setErrors} />}
              {designOption?.type == 2 && <FlyersType errors={errors} setErrors={setErrors} />}
              {designOption?.type == 3 && <CardType errors={errors} setErrors={setErrors} />}
              {
                designOption?.type && designOption?.type > 3 &&
                <div className="mt-2.5 flex flex-col gap-2">
                  {
                    designOption?.type === 11 &&
                    <div className="grid grid-cols-3 gap-x-2">
                      <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 0 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
                        onClick={() => {
                          setDesignOption({ ...designOption, suite: 0 })
                        }}
                      >
                        Standard <br />
                        HK$980/10 pages <br />
                        Includes 1 design<br />
                        Google Slides/PowerPoint<br />
                        1 modification<br />
                        First 10 pages: $980/10 pages<br />
                        Each subsequent page: $98/page<br />
                      </div>
                      <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 1 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
                        onClick={() =>
                          setDesignOption({ ...designOption, suite: 1 })
                        }
                      >
                        Advanced<br />
                        HK$1280/10 pages<br />
                        Includes 1 design<br />
                        Google Slides/PowerPoint<br />
                        3 revisions<br />
                        First 10 pages: $1280/10 pages<br />
                        Each subsequent page: $128/page<br />
                      </div>

                      <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 2 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
                        onClick={() =>
                          setDesignOption({ ...designOption, suite: 2 })
                        }
                      >
                        Special<br />
                        HK$1580/10 pages<br />
                        Includes 1 design<br />
                        Google Slides/PowerPoint<br />
                        5 revisions<br />
                        First 10 pages: $1580/10 pages<br />
                        Each subsequent page: $158/page<br />
                      </div>
                    </div>
                  }
                  <span className="text-sm">{t('demand.description')}</span>
                  <textarea
                    className={`border rounded-lg mt-2.5 p-2.5 w-full outline-none resize-none`}
                    rows={5} placeholder={t('demand.description')} onBlur={(e) => {
                      setAttach({
                        remark: e.target.value
                      })
                    }}></textarea>
                </div> || <></>
              }
            </div>) : ""}
          </div>
          {
            (service === 1 || service === 2) && designOption?.type === 3 ?
              <div className="flex flex-col gap-1">
                <div className="mt-2.5">{t("demand.printTitle")}  +HKD/HK$300</div>
                <div>Size: Same as the selected design size</div>
                <div>Paper: Coated Paper 300g </div>
                <div>Quantity:300</div>
              </div> :
              <></>
          }
          {
            (service === 1 || service === 2) && designOption?.type !== 3 ?
              <div>
                <div className="mt-2.5">{t("demand.printTitle")}</div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
                  <div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-sm text-[#FF3D00]">*</span>
                        <span className="text-sm ml-2.5">{t('demand.printingNumber')}</span>
                      </div>
                      <div className="text-sm text-[#86868B]">{t("demand.printUnit")}</div>
                    </div>
                    <div className="flex border border-[#E5E6EB] rounded-lg mt-2.5">
                      <button
                        className="w-10 h-10 border-r border-[#E5E6EB] flex justify-center items-center cursor-pointer"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          let size = printOption?.quality ? printOption?.quality : 0
                          if (size <= 1) return
                          setPrintOption({
                            quality: (size - 1)
                          })
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      </button>
                      <div className="flex-1">
                        <input value={printOption?.quality ? printOption?.quality : ""} type="number" onChange={event => {
                          setPrintOption({
                            quality: +event.currentTarget.value
                          })
                        }}
                          className="h-10 text-center w-full outline-none" />
                      </div>
                      <button
                        className="w-10 h-10 border-l border-[#E5E6EB] flex justify-center items-center cursor-pointer"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          let size = printOption?.quality ? printOption?.quality : 0
                          setPrintOption({
                            quality: (size + 1)
                          })
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-sm text-[#FF3D00]">*</span>
                        <span className="text-sm ml-2.5">{t('demand.printingPage')}</span>
                      </div>
                    </div>
                    <div className="flex border border-[#E5E6EB] rounded-lg mt-2.5">
                      <button
                        className="w-10 h-10 border-r border-[#E5E6EB] flex justify-center items-center cursor-pointer"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          let page = printOption?.pages ? printOption?.pages : 1
                          if (page <= 1) return
                          setPrintOption({
                            pages: (page - 1)
                          })
                          setDesignOption({
                            pages: page - 1
                          })
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      </button>
                      <div className="flex-1">
                        <input
                          value={printOption?.pages ? printOption?.pages : designOption?.pages ?? ""} type="number" onChange={event => {
                            setPrintOption({
                              pages: +event.currentTarget.value
                            })
                            setDesignOption({
                              pages: +event.currentTarget.value
                            })
                          }}
                          className="h-10 text-center w-full outline-none" />
                      </div>
                      <button
                        className="w-10 h-10 border-l border-[#E5E6EB] flex justify-center items-center cursor-pointer"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          let pages = printOption?.pages ? printOption?.pages : 0
                          setPrintOption({
                            pages: pages + 1
                          })
                          setDesignOption({
                            pages: pages + 1
                          })
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
                  <div>
                    <div>
                      <span className="text-sm text-[#FF3D00]">*</span>
                      <span className="text-sm ml-2.5">{t('demand.printingSize')}</span>
                    </div>
                    <select
                      className={`rounded-lg border ${errors?.printSize ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
                      onChange={(e) => {
                        setPrintOption({
                          size: parseInt(e.target.value)
                        })
                        setDesignOption({
                          size: +e.target.value
                        })
                        delete errors?.printSize
                        delete errors?.size
                        setErrors(errors)
                      }}>
                      <option value={-1}>{t(`demand.printingSize`)}</option>
                      {range(10).map((value, index) => {
                        return (
                          <option value={value} selected={printOption?.size === value || designOption?.size === value} key={index}>{t(`demand.sizeItem.${value}`)}</option>)
                      })}
                    </select>
                  </div>
                  <div>
                    <div>
                      <span className="text-sm text-[#FF3D00]">*</span>
                      <span className="text-sm ml-2.5">{t('demand.coverPaper')}</span>
                    </div>
                    <select
                      className={`rounded-lg border ${errors?.coverPaper ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
                      onChange={(e) => {
                        setPrintOption({
                          coverPaper: parseInt(e.target.value)
                        })
                        delete errors?.coverPaper
                        setErrors(errors)
                      }}>
                      <option value={-1}>{t(`demand.coverPaper`)}</option>
                      {range(19).map((value, index) => {
                        return (
                          <option value={value}>{t(`demand.coverPaperItem.${value}`)}</option>)
                      })}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
                  <div>
                    <div>
                      <span className="text-sm text-[#FF3D00]">*</span>
                      <span className="text-sm ml-2.5">{t('demand.innerPaper')}</span>
                    </div>
                    <select
                      className={`rounded-lg border ${errors?.innerPaper ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
                      onChange={(e) => {
                        setPrintOption({
                          innerPaper: parseInt(e.target.value)
                        })
                        delete errors?.innerPaper
                        setErrors(errors)
                      }}>
                      <option value={-1}>{t(`demand.innerPaper`)}</option>
                      {range(19).map((value) => {
                        return (
                          <option value={value}>{t(`demand.coverPaperItem.${value}`)}</option>)
                      })}
                    </select>
                  </div>
                  <div>
                    <div>
                      <span className="text-sm text-[#FF3D00]">*</span>
                      <span className="text-sm ml-2.5">{t('demand.staple')}</span>
                    </div>
                    <select
                      className={`rounded-lg border ${errors?.bindingType ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
                      onChange={(e) => {
                        console.log(parseInt(e.target.value))
                        setPrintOption({
                          bindingType: parseInt(e.target.value)
                        })
                        delete errors?.bindingType
                        setErrors(errors)
                      }}>
                      <option value={-1}>{t(`demand.staple`)}</option>
                      {range(5).map((value) => {
                        return (<option value={value}>{t(`demand.stapleItem.${value}`)}</option>)
                      })}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
                  <div>
                    <div>
                      <span className="text-sm text-[#FF3D00]">*</span>
                      <span className="text-sm ml-2.5">{t('demand.finish')}</span>
                    </div>
                    <select
                      className={`rounded-lg border ${errors?.finishOptions ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
                      onChange={(e) => {
                        setPrintOption({
                          finishOptions: [parseInt(e.target.value)]
                        })
                        delete errors?.finishOptions
                        setErrors(errors)
                      }}>
                      <option value={-1}>{t(`demand.finish`)}</option>
                      {range(6).map((value, index) => {
                        return (<option value={value}>{t(`demand.finishItem.${value}`)}</option>)
                      })}
                    </select>
                  </div>
                </div>
              </div> : <></>
          }
        </div>
        <div className="flex flex-col md:w-[calc(50%-1.25rem)] w-full my-20 lg:my-0">
          <div className="border-[#E5E6EB] pb-2.5">
            <div>{t("demand.attachmentTitle")}</div>
            <div className="mt-2.5">
              {attach && attach.images && attach.images.length > 0 ? (<div>
                <div className="flex justify-between">
                  <div className="text-sm">{t("demand.attachment")}</div>
                  <div className="flex items-center cursor-pointer" onClick={() => {
                    //@ts-ignore
                    document.getElementById("uploadAttachImagesDialog")?.showModal()
                  }}>
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                      </svg>
                    </div>
                    <div className="text-sm text-[#868686]">{t('demand.uploadDocument')}</div>
                  </div>
                </div>
                {attach.images.map((value, index) => {
                  return (<div className="flex justify-between mt-2.5" key={index}>
                    <div className="flex">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg"
                          className="w-[2.25rem] h-[2.25rem]]"
                          viewBox="0 0 22 24" fill="none">
                          <g clipPath="url(#clip0_262_784)">
                            <mask id="mask0_262_784" maskUnits="userSpaceOnUse" x="-1" y="0"
                              width="24"
                              height="24">
                              <path d="M-1 0H23V24H-1V0Z" fill="white" />
                            </mask>
                            <g mask="url(#mask0_262_784)">
                              <path fillRule="evenodd" clipRule="evenodd"
                                d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z"
                                fill="#09CFBE" />
                              <path
                                d="M14.6392 10.5254C14.7008 10.5721 14.7554 10.6281 14.8008 10.6918L19.8514 17.7504C20.022 17.9886 20.0477 18.3053 19.9181 18.5694C19.7885 18.8335 19.5255 19 19.2381 19H11.8714L12.476 16.3724L11.5208 13.5609L13.5736 10.6918C13.6934 10.5243 13.873 10.4127 14.0728 10.3815C14.2726 10.3503 14.4765 10.4021 14.6392 10.5254ZM10.5773 13.5486L11.524 16.3724L10.9192 19H4.75599L4.73812 18.9995C4.4552 18.9904 4.20049 18.8206 4.07671 18.5585C3.95293 18.2965 3.98048 17.9854 4.14825 17.7507L6.82345 14.0081C6.96702 13.8072 7.19488 13.6885 7.43718 13.6885C7.67949 13.6885 7.90735 13.8072 8.05091 14.0081L9.14905 15.5445L10.5773 13.5486ZM8.19038 9C8.73481 9 9.23787 9.29899 9.51009 9.78433C9.7823 10.2697 9.7823 10.8677 9.51009 11.353C9.23787 11.8383 8.73481 12.1373 8.19038 12.1373C7.34877 12.1373 6.66652 11.435 6.66652 10.5687C6.66652 9.70232 7.34877 9 8.19038 9Z"
                                fill="white" />
                              <path fillRule="evenodd" clipRule="evenodd"
                                d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z"
                                fill="white"
                                fillOpacity="0.25" />
                            </g>
                          </g>
                          <defs>
                            <clipPath id="clip0_262_784">
                              <rect width="22" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="ml-2.5">
                        <div className="text-sm">{value.name}</div>
                        <div
                          className="text-xs text-[#9C9DA5]">{formatBytes(value.size ?? 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center cursor-pointer" onClick={() => {
                      attach?.images?.splice(index, 1)
                      setAttach({ images: attach.images })
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor" className="w-5 h-5 stroke-[#9C9DA5]">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </div>
                  </div>)
                })}
              </div>) : (<div>
                <span className="text-sm">{t("demand.attachment")}</span>
                <div className="border border-[#E5E6EB] py-5 rounded-lg mt-5 cursor-pointer"
                  onClick={() => {
                    //@ts-ignore
                    document.getElementById("uploadAttachImagesDialog")?.showModal()
                  }}>
                  <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      strokeWidth={1.5} stroke="currentColor"
                      className="w-5 h-5 stroke-[#86868B]">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div className="text-sm text-[#86868B] mt-2.5 flex justify-center">{t("upload")}</div>
                </div>
              </div>)}
            </div>
            <div className="mt-2.5">
              <div className="text-sm">{t("demand.link")}</div>
              <input type="text"
                className="border border-[#CFD0D8] rounded-lg h-10 px-2.5 mt-2.5 w-full"
                placeholder={t("demand.link")}
                onBlur={(e) => {
                  setAttach({
                    link: e.target.value
                  })
                }} />
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between">
                <div className="text-sm">{t('demand.remark')}</div>
                <div className=" items-center cursor-pointer tooltip hidden" data-tip="hello">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                      viewBox="0 0 12 12"
                      fill="none">
                      <g clipPath="url(#clip0_76_482)">
                        <path
                          d="M1.5 10.5H4.5V11.25H0.75V0H11.25V4.5H10.5V3H1.5V10.5ZM1.5 0.75V2.25H10.5V0.75H1.5ZM5.25 5.25H7.5V6H6V7.5H5.25V5.25ZM12 5.25V7.5H11.25V6H9.75V5.25H12ZM6 11.25H7.5V12H5.25V9.75H6V11.25ZM11.25 9.75H12V12H9.75V11.25H11.25V9.75Z"
                          fill="#868686" />
                      </g>
                      <defs>
                        <clipPath id="clip0_76_482">
                          <rect width="12" height="12" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <div className="text-sm text-[#86868B] ml-2 ">{t("demand.sample")}</div>
                </div>
              </div>
              <textarea
                className={`border  rounded-lg mt-2.5 p-2.5 w-full outline-none resize-none`}
                rows={5} placeholder={t('demand.remark')} onBlur={(e) => {
                  setAttach({
                    remark: e.target.value
                  })
                }}></textarea>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mt-2.5">{t("demand.deliveryInfo")}</div>
            <div>
              <div className="mt-2.5 flex justify-between text-sm items-center">
                <span className="ml-2.5"> <span className=" text-[#FF3D00]">*</span>{t("demand.deliveryDate")}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-point">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="px-2 py-1 rounded-md bg-base-content/80 text-base-100 text-sm font-light">
                      {/* {t("demand.deliveryTip")} */}
                      Expected completion date<br />
                      Printing date: estimated 4-6 days (special craftsmanship +1-5 days)
                    </div>
                  </TooltipContent>
                </Tooltip>

              </div>
              <div className="mt-2.5">
                <Datepicker
                  disabled={designOption?.type === 3}
                  minDate={dayjs().add(3, "day").toDate()}
                  i18n={lang === "zh" ? "zh" : lang === "en" ? "en" : "zh-TW"}
                  inputClassName={`border ${errors?.date ? 'border-red-500' : 'border-[#CFD0D8]'} rounded-lg h-10 px-2.5 w-full`}
                  value={{
                    // startDate: designOption?.final_delivery_time ? dayjs(designOption.final_delivery_time).toDate() : new Date(),
                    // endDate: designOption?.final_delivery_time ? dayjs(designOption.final_delivery_time).toDate() : new Date()
                    startDate: dayjs(deliveryDate).toDate(),
                    endDate: dayjs(deliveryDate).toDate(),
                  }}
                  useRange={false}
                  asSingle={true}
                  onChange={(date) => {
                    delete errors?.date
                    setErrors(errors)
                    setDesignOption({
                      final_delivery_time: dayjs(date?.endDate).toDate().toISOString()
                    })
                    setDeliveryDate(dayjs(date?.endDate))
                    //@ts-ignore
                    setWorkingDate(date)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="fixed bg-base-100 left-0 right-0 bottom-0 px-5 h-20 flex justify-between items-center shadow-[0px_-6px_12px_0px_rgba(52,92,160,0.05)]">
        <div></div>
        <div className="flex">
          {/* <Link to="/demandCreator" className="border-2 border-[#dcdcdc] text-[#565656] rounded-lg px-5 h-10 leading-10 cursor-pointer">
            {t("prevStep")}
          </Link> */}
          <div className="border-2 border-[#dcdcdc] text-[#565656] rounded-lg px-5 h-10 leading-10 cursor-pointer" onClick={() => {
            navigate(-1)
          }}>
            {t("prevStep")}
          </div>
          <button type="submit"
            className="bg-[#2F4CDD] rounded-lg px-5 h-10 leading-10 text-white cursor-pointer ml-5">
            {t("nextStep")}
          </button>
        </div>
      </div>
    </form >

    <UploaderDialog name="uploadCardDialog" upload={(files) => {
      setBussiness({
        backSide: { ...bussiness?.backSide, attachments: files }
      })
    }} totalSize={1024 * 1024 * 5} maxItemSize={1024 * 1024 * 3} maxItemCount={99} />

    <UploaderDialog name="uploadAttachImagesDialog" upload={(files) => {
      console.log(files.length, "attach")
      setAttach({
        images: [...((attach?.images as any) ?? []), ...(files ?? [])]
      })
    }} totalSize={1024 * 1024 * 5} maxItemSize={1024 * 1024 * 3} maxItemCount={99} />

  </div>
  )
}