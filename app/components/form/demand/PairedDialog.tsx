//@ts-nocheck
import { useTranslation } from "react-i18next"
import Avatar from "~/components/ui/Avatar"
import Logo from "~/images/logo-md.png"
import { UserProps } from "~/utils/store"

type Props = {
  recomments?: UserProps[]
  onSubmit: (ids: number[]) => void
}

export default function ({ recomments = [], onSubmit }: Props) {
  const { t } = useTranslation()
  return (
    <dialog id="pairedDialog" className="modal">
      <div className="modal-box flex flex-col items-center gap-6">
        <img src={Logo} className="w-32" />
        <p className="text-center">
          {t("demand.matchTitle")}
        </p>
        <div className="flex justify-center gap-2">
          {
            recomments.map(val => (
              <Avatar user={val} key={val.id} />
            ))
          }
        </div>
        <p className="text-center">
          {t("demand.matchSubTitle")}
        </p>
        <div className="flex lg:flex-row flex-col items-center justify-center gap-4 w-full">
          <button className="btn rounded-full w-full lg:w-52" onClick={() => (window as any).pairedDialog.close()}>
            {t("demand.back")}
          </button>
          <button className="btn btn-primary rounded-full w-full lg:w-52" onClick={() => {
            (window as any).pairedDialog.close();
            onSubmit(recomments.map(val => val.id ?? 0) ?? [])
          }}>
            {t("demand.next")}
          </button>
        </div>
      </div>
    </dialog >
  )
}