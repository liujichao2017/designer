import { useTranslation } from "react-i18next"
import { UserProps } from "~/utils/store"
import Avatar from "~/components/ui/Avatar"
import { Link } from "@remix-run/react"

type Props = {
  designer: UserProps
  hiddenButton: boolean
  callback?: () => void
}

export default function Designer ({ designer, hiddenButton = false, callback }: Props) {
  const { t } = useTranslation()
  return (
    <div className="py-4 flex justify-between items-end border-b border-base-content/10">
      <div>
        <div className="mb-2.5">{t("designer")}</div>
        <Link to={`/portfolio/${designer.id}`} className="flex items-center gap-3">
          <div className="flex items-center">
            <Avatar user={designer} size="sm" />
            <div className="ml-2.5">
              <span>{designer.name}</span>
            </div>
          </div>
        </Link>
      </div>

      {
        !hiddenButton &&
        <button className="btn btn-sm"
          onClick={_ => callback && callback()}>
          {t("demand.chooseDesigner")}
        </button>
      }
    </div>
  )
}