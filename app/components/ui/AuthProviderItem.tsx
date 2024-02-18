import { useTranslation } from "react-i18next"
import { Avatar } from "./Avatar"
import { GoogleLogo } from "./Logo"

type AuthItemProps = {
  id: number
  provider: string
  email: string | null
  avatar: string | null
  name: string | null
}

export default ({ id, provider, email, avatar, name }: AuthItemProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex gap-5 items-center">
      <div>
        <Avatar
          user={{ name: name ?? "", id, email: email as string, avatar: avatar ?? "" }}
          size="md" />
      </div>
      <div className="flex flex-col gap-2 justify-between text-sm">
        <div>
          <div className="flex gap-2 items-end">
            <span className="text-base font-semibold">{provider}</span>
          </div>
          <div className="flex gap-2 items-end">
            <span className="w-8">{t("userCenter.name")}:</span>
            <span className="text-base">{name}</span>
          </div>
          <div className="flex gap-2 items-end">
            <span className="w-8">{t("userCenter.email")}:</span>
            <span className="text-base truncate w-48">{email}</span>
          </div>
        </div>

        {/* <div>
          <button className="btn btn-sm">
            <GoogleLogo />
            Unbind {provider}
          </button>
        </div> */}

      </div>


    </div >
  )
}