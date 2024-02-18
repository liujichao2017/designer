import SignupForm from "~/components/form/SignupForm"
import bg from "../images/signup-bg.jpg"
import { useTranslation } from "react-i18next"
import { ActionArgs, json, redirect } from "@remix-run/node"
import { isAuthenticated } from "~/utils/sessions.server"
import { SignupValidator } from "~/utils/validators"
import { ResultCode, fault } from "~/utils/result"
import { useService } from "~/services/services.server"
import { UserProps } from "~/utils/store"
import { Link } from "@remix-run/react"
import Logo from "~/components/ui/Logo"

export const action = async (args: ActionArgs) => {
  const current = await isAuthenticated(args)
  if (current) throw redirect("/dashboard/project")

  const form = await args.request.formData()
  const service = useService("auth")

  const result = await SignupValidator.safeParseAsync(Object.fromEntries(form))
  if (!result.success) {
    return fault(ResultCode.FORM_INVALID)
  }
  const user = await service.createAccount(result.data.email, result.data.name, result.data.password)

  if (!user) {
    return fault(ResultCode.EMAIL_ALREADY_EXIST)
  }

  const mailService = useService("mail", { user: user as UserProps })
  mailService.sendActiveMail()
  mailService.sendGreetingMail()
  return json({ code: ResultCode.OK })
}

export default () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col justify-center items-center gap-6 p-2">
      <Logo />

      <div className="flex flex-col items-center">
        <span className="text-xl font-semibold">免費管理您的專案</span>
        <span className="text-neutral-content text-sm">請填寫詳細信息以完成註冊</span>
      </div>

      <SignupForm />

      <div className="flex justify-center">
        已經有帳號了嗎？
        <Link to="/auth/signin" className="link link-info">{t("auth.signin")}</Link>
      </div>
    </div>
  )
}