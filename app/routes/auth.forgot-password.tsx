import { ActionArgs, json } from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import EmailForm from "~/components/form/EmailForm";
import Logo from "~/components/ui/Logo";
import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { EmailValidator } from "~/utils/validators";

export async function action ({ request }: ActionArgs) {
  console.log("action")
  const form = await request.formData()
  const result = await EmailValidator.safeParseAsync(Object.fromEntries(form))
  if (!result.success) {
    console.log(result.error.format())
    return fault(ResultCode.FORM_INVALID)
  }
  useService("mail").sendResetPasswordMail(result.data.email)
  return json({ code: ResultCode.OK })
}

export default function () {
  const { t } = useTranslation()
  const mutation = useFetcher()

  const handleSubmit = (email: string) => {
    mutation.submit({ email }, { method: "post" })
  }

  useEffect(() => {
    if (mutation.state === "idle" && mutation.data?.code === ResultCode.OK) {
      (window as any).sentDialog.showModal();
    }
  }, [mutation])
  return (
    <div className="flex justify-center">
      <div className="w-full md:w-[28rem] md:mt-28 mt-12">

        <div className="flex flex-col p-6 gap-3 rounded-lg shadow-lg bg-base-100">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-sm text-base-content">Enter your email address to accept password reset</span>
          </div>

          <dialog id="sentDialog" className="modal">
            <div className="modal-box">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
              </form>
              <p className="py-4">The password reset email has been sent, please check your email.</p>
            </div>
          </dialog>

          <EmailForm submit={handleSubmit} />

          <div className="flex justify-between text-sm">
            <Link to="/auth/signup" className="link">{t("auth.signup")}</Link>
            <Link to="/auth/signin" className="link">{t("auth.signin")}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}