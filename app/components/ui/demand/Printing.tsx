import { useTranslation } from "react-i18next"
import { PrintOptions } from "~/utils/store"

type Props = {
  print: PrintOptions
}

export default function Printing ({ print }: Props) {
  const { t } = useTranslation()
  return (
    <div className="py-4 border-b border-base-content/10 flex flex-col gap-2">
      <div>{t("demand.printTitle")}</div>
      <div className="grid grid-cols-2">
        <div className="text-sm text-base-content/50">{t("demand.printingNumber")}：
          {
            print.quality !== undefined && print.quality !== -1 &&
            <span className="text-base-content">{print.quality ?? 1}</span>
          }
        </div>
        <div className="text-sm text-base-content/50">{t("demand.printingPage")}：
          {
            print.pages !== undefined && print.pages !== -1 &&
            <span className="text-base-content">{print.pages ?? 1}</span>
          }
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="text-sm text-base-content/50">{t("demand.printingSize")}：
          {
            print.size !== undefined && print.size !== -1 &&
            <span className="text-base-content">{t(`demand.sizeItem.${print.size}`)}</span> || ""
          }
        </div>
        <div className="text-sm text-base-content/50">{t("demand.coverPaper")}：
          {
            print.coverPaper !== undefined && print.coverPaper !== -1 &&
            <span className="text-base-content">{t("demand.coverPaperItem." + print.coverPaper)}</span> || ""
          }
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="text-sm text-base-content/50">{t("demand.innerPaper")}：
          {
            print.size !== undefined && print.size !== -1 &&
            <span className="text-base-content">{t(`demand.sizeItem.${print.size}`)}</span> || ""
          }
        </div>
        <div className="text-sm text-base-content/50">{t("demand.staple")}：
          {
            print.bindingType !== undefined && print.bindingType !== -1 &&
            <span className="text-base-content">{t("demand.stapleItem." + print.bindingType)}</span> || ""
          }
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="text-sm text-base-content/50">{t("demand.finish")}：
          {
            print.finishOptions !== undefined && print.finishOptions.length && print.finishOptions.at(0) !== -1 &&
            <span className="text-base-content">{t("demand.finishItem." + print.finishOptions)}</span> || ""
          }
        </div>
      </div>
    </div>
  )
}