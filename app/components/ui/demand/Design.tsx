import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { PhotoProvider, PhotoView } from "react-photo-view"
import { formatBytes } from "~/utils/helpers"
import { AttachmentOptions, BussinessOptions, DesignOptions } from "~/utils/store"

type Props = {
  service: number
  design: DesignOptions
  bussiness: BussinessOptions
  attach: AttachmentOptions
}

export default function ({ service, design, bussiness, attach }: Props) {
  const { t } = useTranslation()

  return (
    <div className="py-4 border-b border-base-content/10 flex flex-col gap-2">
      <div>{t("demand.stepList.1")}</div>
      <div className="text-sm text-base-content/50">{t("demand.type")}：
        <span className="text-base-content">{t("demand.typeItem." + design?.type)}</span>
      </div>
      <div className="text-sm text-base-content/50">{t("demand.service")}：
        <span className="text-base-content">{t("demand.servicesItem." + service)}</span>
      </div>
      {
        design?.type == 0 &&
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2">
            <div className="text-sm text-base-content/50">{t('demand.category')}：
              <span className="text-base-content">{t("demand.categoryItem." + design?.category)}</span>
            </div>
            <div className="text-sm text-base-content/50">{t('demand.size')}：
              <span className="text-base-content">{t("demand.sizeItem." + design?.size)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="text-sm text-base-content/50">{t('demand.pages')}：
              <span className="text-base-content">{design?.pages}</span>
            </div>
          </div>
        </div>
      }
      {
        design?.type == 1 &&
        <div className="flex flex-col gap-2">
          <div className="text-sm text-base-content/50">{t('demand.logoItemTitle')}：
            <span className="text-base-content">{t("demand.logoItem." + design?.logo)}</span>
          </div>
          <div className="text-sm text-base-content/50">{t('demand.logoDesign')}：
            <span className="text-base-content">{design?.logoSummary}</span>
          </div>
        </div>
      }
      {
        design?.type == 2 &&
        <div className="flex flex-col gap-2">
          <div className="text-sm text-base-content/50">{t(`demand.size`)}：
            <span className="text-base-content">{t("demand.sizeItem." + design?.size)}</span>
          </div>
          <div className="text-sm text-base-content/50">{t('demand.folding')}：
            <span className="text-base-content">{t("demand.foldingItem." + design?.foldingType)}</span>
          </div>
        </div>
      }
      {
        design?.type == 3 &&
        <div className="flex flex-col gap-2">
          <div className="text-sm text-base-content/50">{t('demand.lang')}：
            <span className="text-base-content">{t("demand.langItem." + bussiness?.lang)}</span>
          </div>
          <div className="text-sm text-base-content/50">{t('demand.style')}：
            <span className="text-base-content">{t("demand.styleItem." + bussiness?.style)}</span>
          </div>
          <div className="text-sm text-base-content/50">{t('demand.cardSize')}：
            <span className="text-base-content">{t("demand.cardSizeItem." + bussiness?.size)}</span>
          </div>
          <div className="text-sm text-base-content/50">{t('demand.cardDirect')}：
            <span className="text-base-content">{t("demand.cardDirectItem." + bussiness?.direct)}</span>
          </div>
          <div className="text-sm text-base-content/50 flex flex-col">
            <span>
              {t('demand.frontSide')}：
            </span>
            <span className="text-base-content" dangerouslySetInnerHTML={{
              __html: bussiness?.frontSide?.desc && bussiness?.frontSide?.desc.split("\n").join("<br />") || ""
            }}></span>
          </div>
          <div className="text-sm text-base-content/50 flex flex-col">
            <span>
              {t('demand.backSide')}：
            </span>
            <span className="text-base-content" dangerouslySetInnerHTML={{
              __html: bussiness?.backSide?.desc && bussiness?.backSide?.desc.split("\n").join("<br />") || ""
            }}></span>
          </div>

          <div className="text-sm text-base-content/50">
            <div>{t("demand.uploadBackground")}：</div>
            <PhotoProvider>
              {
                bussiness.backSide?.attachments?.at(0)?.name && bussiness.backSide?.attachments?.map((value, index) =>
                  <PhotoView key={index} src={value.src}>
                    <div className="flex justify-between cursor-pointer my-1">
                      <div className="flex">
                        <div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-[2.25rem] h-[2.25rem]]"
                            viewBox="0 0 22 24" fill="none">
                            <g clip-path="url(#clip0_262_784)">
                              <mask id="mask0_262_784" maskUnits="userSpaceOnUse" x="-1" y="0"
                                width="24"
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
                                  d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z"
                                  fill="white"
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
                          <div
                            className="text-xs text-[#9C9DA5]">{formatBytes(value.size)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </PhotoView>
                )
              }
            </PhotoProvider>
          </div>
        </div>
      }
      <div className="grid grid-cols-2">
        <div className="text-sm text-base-content/50">{t("demand.deliveryDate")}：
          <span className="text-base-content">{dayjs(design?.final_delivery_time).format("YYYY-MM-DD")}</span>
        </div>
        <div className="text-sm text-base-content/50 flex items-center">
          <span>
            {t("demand.link")}：
          </span>
          <a className="text-base-content lg:w-56 w-28 link truncate inline-block" href={attach?.link} target="_blank">{attach?.link}</a>
        </div>
      </div>
      <div className="text-sm text-base-content/50">{t("demand.remark")}：
        <span className="text-base-content truncate flex flex-wrap" dangerouslySetInnerHTML={{
          __html: attach?.remark && attach?.remark.split("\n").join("<br />") || ""
        }}></span>
      </div>
      <div className="text-sm text-base-content/50 flex flex-col gap-1.5">
        <div>{t("demand.attachment")}:</div>
        {
          attach?.images?.at(0)?.name &&
          attach?.images?.map((value, index) =>

            <div className="flex justify-between gap-2" key={index}>
              <div className="flex">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className="w-[2.25rem] h-[2.25rem]]"
                    viewBox="0 0 22 24" fill="none">
                    <g clip-path="url(#clip0_262_784)">
                      <mask id="mask0_262_784" maskUnits="userSpaceOnUse" x="-1" y="0"
                        width="24"
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
                          d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z"
                          fill="white"
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
                <div>
                  <div className="text-sm">{value.name}</div>
                  <div
                    className="text-xs text-base-content/30">{formatBytes(value.size ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ) ||
          <PhotoProvider>
            <div className="flex gap-2">
              {
                attach?.images?.map((value, index) =>
                  <PhotoView src={value.image ?? ""} key={index}>
                    <div className="border-2 border-[#E5E6EB] cursor-pointer">
                      <img
                        src={value.thumbnail ?? value.litpic_url} className="w-20 h-20 object-cover" />
                    </div>
                  </PhotoView>
                )
              }
            </div>
          </PhotoProvider>
        }
      </div>
    </div>
  )
}