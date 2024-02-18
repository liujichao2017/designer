import { ActionArgs, LoaderArgs, defer, json, redirect } from "@remix-run/node"
import { Await, useLoaderData } from "@remix-run/react"
import { Suspense } from "react"
import AuthProviderItem from "~/components/ui/AuthProviderItem"
import { PageError } from "~/components/ui/Errors"
import ChangePasswordForm from "~/components/form/ChangePasswordForm"
import { LoadingPlaceholder } from "~/components/ui/PlaceHolder"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { isAuthenticated } from "~/utils/sessions.server"
import { ChangePasswordValidator } from "~/utils/validators"
import { useTranslation } from "react-i18next"

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const service = useService("profile", { user })
  return defer({ secure: service.getSecure() })
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const { request } = args
  const form = await request.formData()
  const service = useService("profile", { user })
  const _action = form.get("_action")
  switch (_action) {
    case "changePassword":
      {
        const result = await ChangePasswordValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.changePassword(result.data.oldPassword ?? "", result.data.newPassword))
      }
  }
}

export default () => {
  const { secure } = useLoaderData<typeof loader>()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Await resolve={secure} errorElement={<PageError />}>
          {
            secure => {
              return (
                <div className="flex flex-col gap-8 divide-y text-xs md:text-sm">
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg">{t("userCenter.oauth")}</h3>
                    {
                      secure.auths?.map(auth => <AuthProviderItem key={auth.id} {...auth} />)
                    }
                  </div>

                  <div className="flex flex-col gap-4 pt-5 w-full md:w-96">
                    <h3 className="font-bold text-lg">{t("userCenter.changePassword")}</h3>
                    <ChangePasswordForm
                      hasPassword={secure.hasPassword}
                    />
                  </div>
                </div>
              )
            }
          }
        </Await>
      </Suspense>
    </div>
  )
}