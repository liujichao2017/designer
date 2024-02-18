import { ActionArgs, LoaderArgs, json } from "@remix-run/node"
import { useFetcher, useLoaderData, Link } from "@remix-run/react"
import { useTranslation } from "react-i18next"
import ResetForm from "~/components/form/ResetForm"
import { InputError } from "~/components/ui/Errors"
import Logo from "~/components/ui/Logo"
import { useService } from "~/services/services.server"
import { decrypto } from "~/utils/crypto.server"
import { ResultCode, fault } from "~/utils/result"
import { ChangePasswordValidator } from "~/utils/validators"

export async function loader ({ params }: LoaderArgs) {
  const data = decrypto(params.code ?? "") as { expire: number, email: string }
  console.log(data.expire, Date.now())
  if (data.expire < Date.now()) {
    return fault(ResultCode.EXPIRED)
  }
  return json({ code: ResultCode.OK })
}

export async function action ({ request, params }: ActionArgs) {
  const data = decrypto(params.code ?? "") as { expire: number, email: string }
  if (data.expire < Date.now()) {
    return fault(ResultCode.EXPIRED)
  }
  const form = await request.formData()
  const result = await ChangePasswordValidator.safeParseAsync(Object.fromEntries(form))
  if (!result.success) {
    return fault(ResultCode.FORM_INVALID)
  }
  await useService("auth").resetPassword(data.email, result.data.newPassword)
  return json({ code: ResultCode.OK })
}

export default function Page () {
  const { code } = useLoaderData<typeof loader>()
  if (code !== ResultCode.OK) {
    return (
      <div className="flex justify-center">
        <div className="w-full md:w-[28rem] md:mt-28 mt-12">
          <div className="flex flex-col p-6 gap-3 rounded-lg shadow-lg bg-base-100">
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-2xl font-bold text-error">Link expired</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const { t } = useTranslation()
  const mutation = useFetcher()
  const handler = (password: string) => {
    mutation.submit({ newPassword: password, repeatPassword: password }, { method: "post" })
  }
  return (
    <div className="flex justify-center">
      <div className="w-full md:w-[28rem] md:mt-28 mt-12">

        <div className="flex flex-col p-6 gap-3 rounded-lg shadow-lg bg-base-100">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-sm text-base-content">Enter new password</span>
          </div>

          {
            !mutation.data &&
            <ResetForm submit={handler} />
          }

          {
            mutation.data && mutation.data?.code !== ResultCode.OK &&
            <InputError error={t(`errors.${mutation.data?.code}`)} />
          }

          {
            mutation.data && mutation.data?.code === ResultCode.OK &&
            <div className="w-full flex flex-col items-center gap-4">
              <span className="text-success text-xl font-semibold">Reset password success</span>
              <Link to="/auth/signin" className="btn btn-primary btn-wide">Goto Signin</Link>
            </div>
          }

          <div className="flex justify-between text-sm">
            <Link to="/auth/signup" className="link">{t("auth.signup")}</Link>
            <Link to="/auth/signin" className="link">{t("auth.signin")}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}