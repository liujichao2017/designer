import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node"
import { Link, useFetcher, useLoaderData } from "@remix-run/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { EditableAvatar } from "~/components/ui/Avatar"
import { ResultCode, fault } from "~/utils/result"
import { commitSession, getCurrent, getRoles, getSession } from "~/utils/sessions.server"
import { useUserState } from "~/utils/store"
import { EditProfileValidator, ImageDataValidator } from "~/utils/validators"
import { useService } from "~/services/services.server"
import { PageError } from "~/components/ui/Errors"
import { useTranslation } from "react-i18next"

export const ErrorBoundary = ({ error }: { error: Error }) => {
  return <PageError />
}

export const loader = async (args: LoaderArgs) => {
  const user = await getCurrent(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const roles = await getRoles(args)
  const service = useService("profile", { user })
  return json({ profile: await service.getProfile(), roles })
}

export const action = async (args: ActionArgs) => {
  const { request } = args
  const user = await getCurrent(args)
  if (!user) {
    return redirect("/auth/signin")
  }
  const form = await request.formData()
  const _action = form.get("_action")
  const service = useService("profile", { user })
  switch (_action) {
    case "update":
      {
        const result = await EditProfileValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        const { code, profile } = await service.update(result.data.name, result.data.email, result.data.city, result.data.country, result.data.title, result.data.phone, result.data.account, result.data.bank, parseInt(result?.data?.language || '0', 10))
        if (code != ResultCode.OK) {
          return fault(code)
        }
        const session = await getSession(request.headers.get("Cookie"))
        const newUser = { name: profile!.name, email: profile!.email }
        session.set("user", JSON.stringify({ ...user, ...newUser }))
        return json({ code: ResultCode.OK, user: newUser }, { headers: { "Set-Cookie": await commitSession(session) } })
      }
    case "changeAvatar":
      {
        const result = await ImageDataValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        const { code, profile } = await service.changeAvatar(result.data.content)
        if (code != ResultCode.OK) {
          return fault(code)
        }
        const session = await getSession(request.headers.get("Cookie"))
        session.set("user", JSON.stringify({ ...user, avatar: profile?.avatar }))
        return json({ code: ResultCode.OK, avatar: profile?.avatar }, { headers: { "Set-Cookie": await commitSession(session) } })
      }
  }
}

export default () => {
  const { profile, roles } = useLoaderData<typeof loader>()
  const [editing, setEditing] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const [setName, setEmail, setAvatar] = useUserState(state => [state.setName, state.setEmail, state.setAvatar])

  const fetcher = useFetcher()

  const startEdit = useCallback(() => {
    setEditing(true)
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [])

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.code === ResultCode.OK) {
      if (fetcher.data?.user) {
        setName(fetcher.data.user.name)
        setEmail(fetcher.data.user.email)
      }

      if (fetcher.data?.avatar) {
        setAvatar(fetcher.data.avatar)
      }
    }
  }, [fetcher])

  const handleUploadAvatar = useCallback((data: string) => {
    fetcher.submit({ _action: "changeAvatar", content: data }, { method: "post" })
  }, [])

  const handleUpdata = useCallback((data: any) => {
    fetcher.submit({ _action: "update", content: data }, { method: "post" })
  }, [])

  return (
    <div className="flex flex-col pt-6 md:pl-8 gap-8">
       <div className="flex items-center gap-2" style={{
        position: "absolute",
        right: '12px'
       }}>
            <button className="btn btn-primary btn-sm" onClick={startEdit}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {t("userCenter.edit")}
            </button>
        </div>
      <fetcher.Form className="flex flex-col gap-6" id="fields" method="post" onSubmit={(data) => {
        setEditing(false)
        handleUpdata(data)
      }}>
        <div className="flex justify-center flex-wrap flex-col md:flex-row md:justify-between items-start md:items-start gap-2">
          <div>
            <EditableAvatar
              user={{ avatar: profile?.avatar as string, name: profile?.name, id: profile?.id as number, email: profile?.email as string }}
              size="xl"
              upload={handleUploadAvatar}
            />
          </div>
          <div className="flex-1 flex flex-col md:flex-row justify-between items-start gap-6 ease-in-out duration-150">
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="name" className="text-sm">{t("userCenter.name")}</label>
              <input type="text" name="name" id="name" ref={nameRef}
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`}
                defaultValue={profile?.name} readOnly={!editing} />
            </div>
         </div>
        </div>
        <div>基本信息</div>
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start gap-6 ease-in-out duration-150">
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="phone" className="text-sm">{t("userCenter.phone")}</label>
              <input type="text" name="phone" id="phone"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`}
                defaultValue={profile?.profile?.phone ?? ""} readOnly={!editing} />
            </div>
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="email" className="text-sm">{t("userCenter.email")}</label>
              <input type="text" name="email" id="email"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`} defaultValue={profile?.email} readOnly={!editing} />
            </div>
        </div>
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start gap-6 ease-in-out duration-150">
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="gender" className="text-sm">{t("userCenter.sex")}</label>
              <input type="text" name="gender" id="gender"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`}
                defaultValue={profile?.profile?.gender == undefined ? '' : profile?.profile?.gender == 0 ? t('userPortfolio.genderoptions.0'): t('userPortfolio.genderoptions.1')} readOnly={!editing} />
            </div>
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="title" className="text-sm">{t("userCenter.title")}</label>
              <input type="text" name="title" id="title"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`} defaultValue={profile?.profile?.title ?? ""} readOnly={!editing} />
            </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row justify-between items-start gap-6 ease-in-out duration-150">
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="country" className="text-sm">{t("userCenter.country")}</label>
              <input type="text" name="country" id="country"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`}
                defaultValue={profile?.profile?.country ?? ""} readOnly={!editing} />
            </div>
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="city" className="text-sm">{t("userCenter.city")}</label>
              <input type="text" name="city" id="city"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`} defaultValue={profile?.profile?.city ?? ""} readOnly={!editing} />
            </div>
        </div>
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start gap-6 ease-in-out duration-150">
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="country" className="text-sm">{t("userCenter.language")}</label>
              <select id="language" name="language" disabled={!editing} className="select h-8 min-h-0 max-h-8 border-none text-sm focus:outline-none px-0" defaultValue={profile?.profile?.language ?? ""} >
                <option value="0">{t("userCenter.languageList.0")}</option>
                <option value="1">{t("userCenter.languageList.1")}</option>
                <option value="2">{t("userCenter.languageList.2")}</option>
              </select>
            </div>
        </div>
        <div>{t('userPortfolio.bankinfo')}</div>
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start gap-6 ease-in-out duration-150">
            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="account" className="text-sm">{t("userCenter.account")}</label>
              <input type="text" name="account" id="account"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`}
                defaultValue={profile?.profile?.account?.replace(/(?<=\d{4})\d+(?=\d{4})/," **** **** ") ?? ""} readOnly={!editing} />
            </div>

            <div className="flex flex-col md:w-1/2 gap-1 w-full">
              <label htmlFor="bank" className="text-sm">{t("userCenter.bank")}</label>
              <input type="text" name="bank" id="bank"
                className={`w-full ${editing && "border-b"} border-base-300 py-1 active:border-base-content focus:border-base-content outline-none font-medium`}
                defaultValue={profile?.profile?.bank ?? ""} readOnly={!editing} />
            </div>
        </div>
        <div className={`justify-end gap-2 items-end ${!editing && "hidden" || "flex"}`}>
            {fetcher.state === "idle" && fetcher.data?.code !== ResultCode.OK && <span className="text-red-500 text-sm">{fetcher.data?.reason}</span>}
            {/* <a className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</a> */}
            <button className="btn btn-primary" type="submit">{t("save")}</button>
        </div>

        <input type="hidden" name="_action" value={"update"} />
      </fetcher.Form>
    </div >
  )
}