import { LoaderArgs, redirect } from "@remix-run/node"
import { useNavigate, useParams, useSearchParams } from "@remix-run/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import AttachForm from "~/components/form/demand/AttachForm"
import ContactForm from "~/components/form/demand/ContactForm"
import DesignForm from "~/components/form/demand/DesignForm"
import { ResultCode } from "~/utils/result"

export function loader ({ request, params: { step } }: LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const sid = searchParams.get("sid")
  if (!sid) return redirect("/portfolio")
  return { code: ResultCode.OK }
}

export default function Page () {
  const { step } = useParams()
  const [searchParams,] = useSearchParams()
  const _step = step && +step || 0
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!searchParams.get("sid")) navigate("/dashboard/profile/info")
  })

  return (
    <div className="w-screen overflow-x-hidden">
      {_step === 0 &&
        <ContactForm />
      }

      {
        _step === 1 &&
        <DesignForm />
      }

      {
        _step === 2 &&
        <AttachForm />
      }
    </div>
  )
}
