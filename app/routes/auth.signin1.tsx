import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node"
import { Link, useFetcher } from "@remix-run/react"
import { ResultCode, fault } from "~/utils/result"
import { commitSession, getCurrent, getSession } from "~/utils/sessions.server"
import { LocalSigninValidator } from "~/utils/validators"

import SigninForm from "~/components/form/SigninForm"

import { useTranslation } from "react-i18next"
import { useService } from "~/services/services.server"
import { UserProps } from "~/utils/store"
import Logo, { GoogleLogo } from "~/components/ui/Logo"

export const loader = async (args: LoaderArgs) => {
  const user = await getCurrent(args)
  const { searchParams } = new URL(args.request.url)
  const nextUrl = searchParams.get("next") || "/dashboard/project"
  if (user) {
    return redirect(nextUrl)
  }
  return { code: ResultCode.OK }
}

const validProviders = ["google", "local"]

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData()
  const provider = form.get("provider") as string
  if (!validProviders.includes(provider)) {
    return fault(ResultCode.AUTH_PROVIDER_INVALID)
  }

  const service = useService("auth")

  const { searchParams } = new URL(request.url)
  const nextUrl = searchParams.get("next") || "/dashboard/project"
  switch (provider) {
    case "google":
      const url = service.getGoogleAuthUrl()
      throw redirect(url)
    case "local":
    default:
      const result = await LocalSigninValidator.safeParseAsync(Object.fromEntries(form))
      if (!result.success) {
        return fault(ResultCode.FORM_INVALID)
      }
      const { user, code } = await service.authWithLocal(result.data.email, result.data.password)
      if (code != ResultCode.OK) {
        if (code === ResultCode.ACCOUNT_NOT_ACTIVED) {
          await useService("mail", { user: user as unknown as UserProps }).sendActiveMail()
        }
        return fault(code)
      }
      const roles = user?.roles.map(r => r.role?.name)
      const teams = user?.teams.map(t => ({ name: t.team?.name, id: t.team?.id }))
      const session = await getSession(request.headers.get("Cookie"))
      session.set("user", JSON.stringify(user))
      session.set("roles", JSON.stringify(roles))
      session.set("teams", JSON.stringify(teams))
      return redirect(nextUrl, { headers: { "Set-Cookie": await commitSession(session) } })
  }
}


export default () => {
  const fetcher = useFetcher()

  const { t } = useTranslation()

  const handleGoogle = () => {
    fetcher.submit({ provider: "google" }, { method: "post" })
  }

  return (
    <div className="flex justify-center">
      <div className="w-full md:w-[28rem] md:mt-28 mt-12">

        <div className="flex flex-col p-6 gap-3 rounded-lg">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-sm text-base-content">Welcome back! Please fill in your detailed information.</span>
          </div>
          <div className="flex-1">
            <button className="btn w-full" type="submit" onClick={handleGoogle}>
              <GoogleLogo />
              {t("auth.signinWithGoogle")}
            </button>
          </div>
          <div className="divider">OR</div>

          <SigninForm />

          <div className="flex justify-between text-sm">
            <Link to="/auth/signup" className="link">{t("auth.signup")}</Link>
            <Link to="/auth/forgot-password" className="link">{t("auth.forgotPassword")}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}