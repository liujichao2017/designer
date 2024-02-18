import { useTranslation } from "react-i18next";
import { Seal } from "../Logo";
import PaidSeal from "~/images/paidSeal.png"

export type Props = {
  demand: {
    type?: number,
    size?: number,
    quotation?: number | string,
    printing_number?: number,
    discount?: number
  },
  payments?: {
    pay_price?: number | string,
    id: number
  }[],
  paid?: boolean
}

export default function Order ({ demand, payments = [], paid = false }: Props) {
  const { t } = useTranslation()
  const quotation = demand.quotation ? +demand.quotation : 0

  return (
    <div className="flex flex-col gap-2 relative">

      <div className="flex justify-between">
        <h3>{t("payOrder.orderTitle")}</h3>
      </div>

      <div className="grid grid-cols-6 border-b border-base-content/10 text-sm text-base-content/60 py-2">
        <span>{t("payOrder.summary")}</span>
        <span>{t("payOrder.price")}</span>
        <span>{t("payOrder.quantity")}</span>
        <span>{t("payOrder.discount")}</span>
        <span>{t("payOrder.tax")}</span>
        <span>{t("payOrder.other")}</span>
      </div>

      <div className="grid grid-cols-6 border-b border-base-content/10 text-sm pb-2">
        <div className="flex flex-col">
          <span>
            {t("demand.type")} : {t("demand.typeItem." + demand.type)}
          </span>
          {
            demand.size !== -1 && demand.size !== undefined &&
            <span>
              {t("demand.size")} : {t("demand.sizeItem." + demand.size)}
            </span>
          }
          <span>
            {t("demandorder.timeline.drafttime")} : 4
          </span>
          <span>
            {t("demandorder.timeline.comptime")} : --
          </span>
          <span>
            檔案: 原檔 + PDF
          </span>
          <span>
            修改: 無限
          </span>
        </div>

        <div className="flex items-center">
          {
            !!demand.quotation && `HK$${demand?.quotation}`
          }
        </div>

        <div className="flex items-center">
          {
            !!demand.printing_number && demand.printing_number > 0 && demand.printing_number
          }
        </div>

        <div className="flex items-center">
          {
            !!demand.discount && `${(1 - demand.discount) * 100}%`
          }
        </div>

        <div className="flex items-center">
          0
        </div>

        <div className="flex items-center">
          0
        </div>
      </div>

      <div className="grid grid-cols-6 border-b border-base-content/10 text-sm pb-2">
        <div className="col-span-2 flex flex-col">
          <Seal />
        </div>

        <div className="col-span-2"></div>

        <div className="col-span-2 flex flex-col justify-center items-center gap-2 text-base-content/80">
          <div className="border-b border-base-content/10 w-full flex justify-between pb-2">
            <span>{t("payOrder.amount")}</span>
            <span>
              HK${(quotation ?? 0) * (1 - (demand.discount ?? 0))}
            </span>
          </div>
          <div className="w-full flex justify-between">
            <span>
              {t("payOrder.paid")}
            </span>
            <span>
              HK${payments.map(v => v.pay_price).reduce((a, b) => (a ? +a : 0) + (b ? +b : 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {
        !!paid &&
        <img src={PaidSeal} alt="paid seal" className="bottom-4 right-4 absolute z-10" />
      }
    </div>
  )
}