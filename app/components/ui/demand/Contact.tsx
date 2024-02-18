import { useTranslation } from "react-i18next"

type Props = {
  infomation: {
    name: string,
    whatsapp: string,
    email: string
  }
}


export default function Contact ({ infomation }: Props) {
  const { t } = useTranslation()
  return (
    <div className="py-4 border-b border-base-content/10 flex flex-col gap-2">
      <div>{t("demand.stepList.0")}</div>
      <div className="grid grid-cols-2 ">
        <div className="text-sm text-[#86868B]">{t("demand.name")}：<span
          className="text-base-content truncate">{infomation?.name ?? ""}</span>
        </div>
        <div className="text-sm text-[#86868B]">Whatsapp：<span
          className="text-base-content">{infomation?.whatsapp ?? ""}</span>
        </div>
      </div>
      <div className="text-sm text-[#86868B]">Email：<span
        className="text-base-content">{infomation?.email ?? ""}</span>
      </div>
    </div>
  )
}