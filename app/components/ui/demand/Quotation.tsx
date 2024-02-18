import { useFetcher } from "@remix-run/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatMoney } from "~/utils/helpers"
import { ResultCode } from "~/utils/result"

type Props = {
  id?: number,
  endPoint?: string,

  params?: {
    service?: number,
    type?: number,
    pages?: number,
    pictures?: number[],
    size?: number,
    suite?: number
  }

  pdf?: string,

  editQuotation?: () => void,
  uploadQuotationPdf?: () => void,

  ts?: number
}

export default function Quotation ({ id, endPoint, pdf, params, editQuotation, uploadQuotationPdf, ts }: Props) {
  const { t } = useTranslation()
  const [quotation, setQuotation] = useState<{
    level: number,
    quotation: { price: number, totalPrice: number, discount: number, pages: number, printPrice?: number },
    pdf: string
  }>()

  useEffect(() => {
    if (id && endPoint) {
      fetch(`${endPoint}/api/demand?loader=quotation&id=${id}`)
        .then(resp => resp.json())
        .then(data => {
          if (data.code === ResultCode.OK) {
            console.log(data)
            setQuotation(data)
          }
        })
    }
    if (params) {
      fetch(`${endPoint}/api/demand?loader=quotationPlain&pictures=${params?.pictures?.join(",")}&type=${params?.type}&pages=${params?.pages}&size=${params?.size}&service=${params?.service}&suite=${params?.suite ?? -1}&t=${Date.now()}`)
        .then(resp => resp.json())
        .then(data => {
          if (data.code === ResultCode.OK) {
            setQuotation(data)
          }
        })

    }
  }, [ts])
  return (
    <div className="py-4 border-b border-base-content/10 flex flex-col gap-2">
      <div>{t("demand.quotationTitle")}</div>
      {
        quotation?.level && quotation.quotation &&
        <div className="flex flex-col gap-1.5">
          {
            !quotation?.quotation?.price &&
            <>
              <div className="text-sm text-base-content/50">{t("demand.totalPrice")}：{t("payOrder.tobeQuoted")}</div>
              <div className="text-sm text-base-content/50">{t("demand.price")}：{t("payOrder.tobeQuoted")}</div>
              {
                quotation?.quotation?.printPrice !== undefined &&
                <div className="text-sm text-base-content/50">{t("payOrder.printPrice")}：
                  {
                    quotation?.quotation?.printPrice &&
                    <>
                      HK${formatMoney(quotation?.quotation?.printPrice, 2)}
                    </> ||
                    <>
                      {t("payOrder.tobeQuoted")}
                    </>

                  }
                </div>
              }
            </> ||
            <>
              <div className="text-sm text-base-content/50">{t("demand.totalPrice")}：
                <span className="text-base-content">
                  HK${formatMoney(quotation?.quotation?.totalPrice, 2)} (HK${formatMoney(quotation?.quotation.price)}/Page)
                </span>
              </div>
              {/* <div className="text-sm text-base-content/50">{t("demand.price")}：
                <span className="text-base-content">
                  HK${formatMoney(quotation?.quotation?.price, 2)}
                </span>
              </div> */}
              {
                !!quotation?.quotation?.discount &&
                <div className="text-sm text-base-content/50">{t("demand.discountPrice")}({(1 - quotation?.quotation?.discount) * 100}%)：
                  <span className="text-base-content">
                    HK${formatMoney(quotation?.quotation?.totalPrice * (1 - quotation?.quotation?.discount), 2)} (HK${formatMoney(quotation?.quotation?.price * (1 - quotation?.quotation?.discount))}/Page)
                  </span>
                </div>
              }

              {
                quotation?.quotation?.printPrice !== undefined &&
                <div className="text-sm text-base-content/50">{t("payOrder.printPrice")}：
                  <span className="text-base-content">
                    {
                      quotation?.quotation?.printPrice &&
                      <>
                        HK${formatMoney(quotation?.quotation?.printPrice, 2)}
                      </> ||
                      <>
                        {t("payOrder.tobeQuoted")}
                      </>

                    }
                  </span>
                </div>
              }

            </>
          }
          {
            !!quotation?.level &&
            <div className="text-sm text-base-content/50">{t("demand.level")}：
              <span className="text-base-content">
                {quotation?.level}
              </span>
            </div>
          }

          {
            quotation?.pdf &&
            <div className="text-sm text-base-content/50 flex items-center">Quotation PDF：
              <a className="text-base-content inline-block lg:w-60 w-40 truncate link" href={quotation?.pdf} target="_blank">
                {quotation?.pdf}
              </a>
            </div>
          }

          <div className="flex gap-3" id={ts + ""}>
            {
              editQuotation &&
              <button className="btn btn-xs font-normal capitalize" onClick={_ => editQuotation()}>Edit Quotation</button>
            }
            {
              uploadQuotationPdf &&
              <button className="btn btn-xs font-normal capitalize" onClick={_ => uploadQuotationPdf()}>Upload Quotation PDF</button>
            }
          </div>
        </div>
      }
    </div>
  )
}