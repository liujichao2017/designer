import { LoaderArgs, defer, redirect, ActionArgs, json } from "@remix-run/node"
import { Await, Link, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOutletContext } from '@remix-run/react'
import UploaderDialog from "~/components/form/UploaderDialog"
import { PortfolioPictureList2 } from "~/components/ui/PortfolioPictureList"
import { useService } from "~/services/services.server"
import { ResultCode } from "~/utils/result"
import { hasRole, isAuthenticated } from "~/utils/sessions.server"
import { Roles, useUserState } from "~/utils/store"
import { UploadValidator, IdValidator } from "~/utils/validators"

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const isPro = await hasRole(Roles.PRO, args)
  const data = await args.request.json()
  const service = useService("profile", { user })
  const { _action } = data
  switch (_action) {
    case "upload":
      {
        const result = await UploadValidator.safeParseAsync(data)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.uploadPortfolio(result.data.contents, isPro))
      }
    case "removePortfolio":
      {
        const result = IdValidator.safeParse(data)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.removePortfolio(result.data.id))
      }
  }
}

export default () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const mutation = useFetcher()
  const setAvatar = useUserState((s) => s.setAvatar)
  const { profile }: any = useOutletContext();

  useEffect(() => {
    if (mutation.data?.avatar) {
      setAvatar(mutation.data.avatar)
    }
  }, [mutation])

  const upload = (files: any[]) => {
    mutation.submit({ _action: "upload", contents: files.map(f => f.src) }, { method: "post", encType: "application/json" })
  }

  return (
    <div>
      <UploaderDialog upload={upload} />
      <PortfolioPictureList2 pictures={profile?.portfolios}
        add={() => { window?.uploaderDialog.showModal() }} editable={!id}
        remove={(id: number) => {
          mutation.submit({ _action: "removePortfolio", id }, { method: "post", encType: "application/json" })
        }} />
    </div>
  )
}
