import { range } from "~/utils/helpers";
import { t } from "i18next";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import { useDemandState } from "~/utils/store";
import UploaderDialog from "~/components/form/UploaderDialog";

type Params = {
  errors: Record<string, string> | undefined,
  setErrors: Dispatch<SetStateAction<Record<string, string> | undefined>>
}

const defaultFrontText = `名稱：
職位：
電話：
電子郵件地址：
其他備註：
`

export default ({ errors, setErrors }: Params) => {
  const [bussiness, setBussiness, setDesignOption, designOption] = useDemandState(state => [state.bussiness, state.setBussiness, state.setDesignOption, state.design])
  const [, startTransition] = useTransition()
  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.lang')}</span>
          </div>
          <div className="mt-2.5">
            <select
              className={`rounded-lg border ${errors?.cardLang ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
              onChange={(e) => {
                setBussiness({ ...bussiness, lang: parseInt(e.target.value) })
                delete errors?.cardLang
                setErrors(errors)
              }}>
              <option value={-1}>{t(`demand.lang`)}</option>
              {range(5).map((value, index) => {
                return (<option key={index} value={value}
                  selected={value == bussiness?.lang}>{t(`demand.langItem.${value}`)}</option>)
              })}
            </select>
          </div>
        </div>
        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.style')}</span>
          </div>
          <div className="mt-2.5">
            <select
              className={`rounded-lg border ${errors?.cardStyle ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
              onChange={(e) => {
                setBussiness({ ...bussiness, style: parseInt(e.target.value) })
                delete errors?.cardStyle
                setErrors(errors)
              }}>
              <option value={-1}>{t(`demand.style`)}</option>
              {range(5).map((value, index) => {
                return (<option key={index} value={value} selected={value == bussiness?.style}>{t(`demand.styleItem.${value}`)}</option>)
              })}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.cardSize')}</span>
          </div>
          <div className="mt-2.5">
            <select
              className={`rounded-lg border ${errors?.cardSize ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
              onChange={(e) => {
                setBussiness({ ...bussiness, size: parseInt(e.target.value) })
                delete errors?.cardSize
                setErrors(errors)
              }}>
              <option value={-1}>{t(`demand.cardSize`)}</option>
              {range(2).map((value, index) => {
                return (<option key={index} value={value} selected={value == bussiness?.size}>{t(`demand.cardSizeItem.${value}`)}</option>)
              })}
            </select>
          </div>
        </div>

        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.cardDirect')}</span>
          </div>
          <div className="mt-2.5">
            <select
              className={`rounded-lg border ${errors?.cardDirect ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
              onChange={(e) => {
                setBussiness({ ...bussiness, direct: parseInt(e.target.value) })
                delete errors?.cardDirect
                setErrors(errors)
              }}>
              <option value={-1}>{t(`demand.cardDirect`)}</option>
              {range(3).map((value, index) => {
                return (<option key={index} value={value} selected={value == bussiness?.direct}>{t(`demand.cardDirectItem.${value}`)}</option>)
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <div>
          <span className="text-sm ml-2.5">套餐</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2.5">
          <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 0 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
            onClick={() => {
              setBussiness({ ...bussiness, suite: 0 })
              setDesignOption({ ...designOption, suite: 0 })
            }}
          >
            <p>Special Offer</p>
            <p>HK$99/serving</p>
            <p>Double-sided design</p>
            <p>1st Draft Design</p>
            <p>A large selection of different design effects;</p>
            <p>PDF print file</p>
            <p>1 modification</p>
            <p>Delivery in 3 days</p>
          </div>
          <div className={`rounded-md border-2 p-2 cursor-pointer ${designOption?.suite === 1 ? "border-primary shadow-lg bg-base-100" : "border-base-content/10"}`}
            onClick={() => {
              setBussiness({ ...bussiness, suite: 1 })
              setDesignOption({ ...designOption, suite: 1 })
            }}
          >
            <p>Advanced</p>
            <p>HK$798/serving</p>
            <p>Double-sided design</p>
            <p>1st Draft Design</p>
            <p>A large selection of different design effects;</p>
            <p> AI file + PDF printing file</p>
            <p>3 revisions</p>
            <p> Delivery in 3 days</p>
            <p>Add design files with different names +$198/copy</p>
          </div>
        </div>
      </div>


      <div className="mt-2.5">
        <div>
          <span className="text-sm text-[#FF3D00]">*</span>
          <span className="text-sm ml-2.5">{t('demand.frontSide')}</span>
        </div>
        <textarea
          className={`border ${errors?.logoSummary ? 'border-red-500' : 'border-[#E5E6EB]'} rounded-lg p-2.5 w-full outline-none resize-none mt-2.5`}
          rows={5} defaultValue={bussiness?.frontSide?.desc || defaultFrontText}
          onChange={(e) => {
            startTransition(() => setBussiness({
              ...bussiness,
              frontSide: { desc: e.target.value ?? "", attachments: bussiness?.frontSide?.attachments }
            }))
            delete errors?.logoSummary
            setErrors(errors)
          }}>
        </textarea>
      </div>
      <div className="mt-2.5">
        <div>
          <span className="text-sm">{t('demand.backSide')}</span>
        </div>
        <textarea className="border border-[#CFD0D8] rounded-lg p-2.5 w-full outline-none resize-none mt-2.5"
          rows={5} defaultValue={bussiness?.backSide?.desc} onChange={(e) => {
            startTransition(() => setBussiness({
              ...bussiness,
              backSide: { desc: e.target.value ?? "", attachments: bussiness?.backSide?.attachments ?? [] }
            }))
          }}></textarea>
      </div>
      <div className="mt-2.5">
        {bussiness?.backSide?.attachments && bussiness?.backSide?.attachments?.length > 0 ? (<div>
          <div className="flex justify-between">
            <div className="text-sm">{t("demand.uploadLogo")}</div>
            <div className="flex items-center cursor-pointer" onClick={() => {
              (window as any).uploadCardDialog.showModal()
            }}>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                  stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <div className="text-sm text-[#868686]">{t("upload")}</div>
            </div>
          </div>
        </div>) : (<div>
          <div className="text-sm">{t("demand.uploadLogo")}</div>
          <div className="border border-[#E5E6EB] py-5 rounded-lg mt-2.5 cursor-pointer bg-white"
            onClick={(e) => {
              (window as any).uploadCardDialog.showModal()
            }}>
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 stroke-[#86868B]">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="text-sm text-[#86868B] mt-2.5 flex justify-center">{t("upload")}</div>
          </div>
        </div>)}
      </div>
      <div className="mt-2.5">
        {
          bussiness?.backSide?.attachments && bussiness.backSide?.attachments?.map((value, index) => {
            return (
              <div className="flex justify-between mt-2.5" key={index}>
                <div className="flex">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-[2.25rem] h-[2.25rem]]"
                      viewBox="0 0 22 24" fill="none">
                      <g clip-path="url(#clip0_262_784)">
                        <mask id="mask0_262_784" maskUnits="userSpaceOnUse" x="-1" y="0" width="24"
                          height="24">
                          <path d="M-1 0H23V24H-1V0Z" fill="white" />
                        </mask>
                        <g mask="url(#mask0_262_784)">
                          <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z"
                            fill="#09CFBE" />
                          <path
                            d="M14.6392 10.5254C14.7008 10.5721 14.7554 10.6281 14.8008 10.6918L19.8514 17.7504C20.022 17.9886 20.0477 18.3053 19.9181 18.5694C19.7885 18.8335 19.5255 19 19.2381 19H11.8714L12.476 16.3724L11.5208 13.5609L13.5736 10.6918C13.6934 10.5243 13.873 10.4127 14.0728 10.3815C14.2726 10.3503 14.4765 10.4021 14.6392 10.5254ZM10.5773 13.5486L11.524 16.3724L10.9192 19H4.75599L4.73812 18.9995C4.4552 18.9904 4.20049 18.8206 4.07671 18.5585C3.95293 18.2965 3.98048 17.9854 4.14825 17.7507L6.82345 14.0081C6.96702 13.8072 7.19488 13.6885 7.43718 13.6885C7.67949 13.6885 7.90735 13.8072 8.05091 14.0081L9.14905 15.5445L10.5773 13.5486ZM8.19038 9C8.73481 9 9.23787 9.29899 9.51009 9.78433C9.7823 10.2697 9.7823 10.8677 9.51009 11.353C9.23787 11.8383 8.73481 12.1373 8.19038 12.1373C7.34877 12.1373 6.66652 11.435 6.66652 10.5687C6.66652 9.70232 7.34877 9 8.19038 9Z"
                            fill="white" />
                          <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white"
                            fill-opacity="0.25" />
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
                    <div className="text-xs text-[#9C9DA5]">{(value.size / 1048576).toFixed(2)} MB</div>
                  </div>
                </div>
                <div className="flex items-center cursor-pointer" onClick={() => {
                  setBussiness({
                    backSide: { ...bussiness.backSide, attachments: bussiness?.backSide?.attachments?.filter(item => item.id !== value.id) }
                  })
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                    stroke="currentColor" className="w-5 h-5 stroke-[#9C9DA5]">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
              </div>)
          }
          )
        }
      </div>
    </div >
  )
}