// @ts-nocheck
import { LoaderArgs, defer, redirect, ActionArgs, json } from "@remix-run/node"
import { Await, Link, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import ExperienceForm from "~/components/form/ExperienceForm"
import ProfileBaseForm from "~/components/form/ProfileBaseForm"
import ShareLinkDialog from "~/components/form/ShareLinkDialog"
import UploaderDialog from "~/components/form/UploaderDialog"
import { EditableAvatar } from "~/components/ui/Avatar"
import ExperienceList from "~/components/ui/ExperienceList"
import { LoadingPlaceholder } from "~/components/ui/PlaceHolder"
import PortfolioPictureList from "~/components/ui/PortfolioPictureList"
import SkillList from "~/components/ui/SkillList"
import { useService } from "~/services/services.server"
import { ResultCode } from "~/utils/result"
import { isAuthenticated } from "~/utils/sessions.server"
import { useUserState } from "~/utils/store"
import { ExperienceValidator, IdValidator, NameValidator, ProfileBaseValidator, UploadValidator } from "~/utils/validators"

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user && !args.params.id) {
    throw redirect("/auth/signin")
  }
  const {
    request
  } = args
  const userAgent = request.headers.get('User-Agent') ?? '';
  const isMobile = /Mobi|Android/i.test(userAgent);

  if (!isMobile) {
      const id = args.params.id;
      if (id) {
          throw redirect(`/portfolio/main/${id}/project`)
      }
      throw redirect('/portfolio/main/project')
  }
  const service = useService("profile", { user })
  const id = args.params.id || user.id
  return defer({
    profile: service.getAllProfile(Number(id)),
    categories: await useService("picture").getCategorys(),
    endPoint: process.env.END_CUSTOM_POINT
  })
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
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
        return json(await service.uploadPortfolio(result.data.contents))
      }
    case "addExperience":
      {
        const result = await ExperienceValidator.safeParseAsync(data)
        if (!result.success) {
          console.log(result.error.format())
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.addExperience(result.data.company, result.data.title, result.data.description, result.data.start_at, result.data.end_at, result.data.active, result.data.country, result.data.city))
      }
    case "removeExperience":
      {
        const result = IdValidator.safeParse(data)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.removeExperience(result.data.id))
      }
    case "removePortfolio":
      {
        const result = IdValidator.safeParse(data)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.removePortfolio(result.data.id))
      }
    case "saveBase":
      {
        const result = await ProfileBaseValidator.safeParseAsync(data)
        if (!result.success) {
          console.log(result.error.format())
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.saveBase(result.data.name, result.data.description, +result.data.gender, result.data.phone, result.data.country))
      }
    case "removeSkill":
      {
        const result = IdValidator.safeParse(data)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.removeSkill(result.data.id))
      }
    case "addSKill":
      {
        const result = await NameValidator.safeParseAsync(data)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.addSkill(result.data.name))
      }
  }
}

export default () => {
  const { t } = useTranslation()
  const { profile, categories, endPoint } = useLoaderData<typeof loader>()
  const { id } = useParams()
  const mutation = useFetcher()
  const setAvatar = useUserState((s) => s.setAvatar)
  const [openExperience, setOpenExperience] = useState(false)
  const [base, setBase] = useState<{ name: string, description: string, phone: string, gender: string, country: string }>()

  const navigate = useNavigate()

  const handleUploadAvatar = useCallback((data: string) => {
    mutation.submit({ _action: "changeAvatar", content: data }, { method: "post", action: "/dashboard/profile/info" })
  }, [])

  useEffect(() => {
    if (mutation.data?.avatar) {
      setAvatar(mutation.data.avatar)
    }
  }, [mutation])

  const upload = (files: FileContent[]) => {
    mutation.submit({ _action: "upload", contents: files.map(f => f.src) }, { method: "post", encType: "application/json" })
  }

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Await resolve={profile}>
        {
          profile => (
            <>
              <UploaderDialog upload={upload} />
              <div className="flex flex-col items-center md:flex-row md:items-start gap-2">
                <div className="w-36">
                  <EditableAvatar user={profile} upload={handleUploadAvatar} size="xl" />
                </div>
                <div className="w-full">
                  <ProfileBaseForm
                    name={profile?.name ?? ""}
                    description={profile?.profile?.description ?? ""}
                    phone={profile?.profile?.phone ?? ""}
                    gender={profile?.profile?.gender ?? 0}
                    email={profile?.email ?? ""}
                    country={profile?.profile?.country ?? ""}
                    editable={!id}
                    onChange={(data: Record<string, string>) => {
                      setBase(prev => ({ ...prev, ...data }))
                    }} />
                </div>
              </div>

              <div>
                <ExperienceList experiences={profile?.experiences} editable={!id}
                  add={() => { setOpenExperience(prev => !prev) }}
                  remove={(id: number) => { mutation.submit({ _action: "removeExperience", id }, { method: "post", encType: "application/json" }) }} />
                {openExperience && <ExperienceForm cancel={() => { setOpenExperience(false) }} />}
              </div>

              <div>
                <SkillList
                  editable={!id}
                  skills={profile?.skills.map(val => val.skill)}
                  remove={(id: number) => {
                    mutation.submit({ _action: "removeSkill", id }, { method: "post", encType: "application/json" })
                  }}
                  add={(name: string) => {
                    mutation.submit({ _action: "addSKill", name }, { method: "post", encType: "application/json" })
                  }}
                  defaultSkillItems={categories.map(val => val.name)} />
              </div>

              <div>
                <PortfolioPictureList pictures={profile?.portfolios}
                  add={() => { window.uploaderDialog.showModal() }} editable={!id}
                  remove={(id: number) => {
                    mutation.submit({ _action: "removePortfolio", id }, { method: "post", encType: "application/json" })
                  }} />
              </div>

              <div className="flex justify-end gap-2">
                {
                  id &&
                  <>
                    <button to="/dashboard/profile" className="btn btn-primary cursor-pointer" onClick={() => navigate(-1)}>{t("demand.back")}</button>
                  </> ||
                  <>
                    <Link to="/dashboard/profile" className="btn">{t("cancel")}</Link>
                    <button to="/dashboard/profile" className="btn cursor-pointer" onClick={
                      _ => {
                        (window as any).shareLinkDialog.showModal();
                      }
                    }>{t("share")}
                    </button>
                    <button className="btn btn-primary" onClick={
                      () => {
                        mutation.submit({ _action: "saveBase", ...base }, { method: "post", encType: "application/json" })
                      }
                    }>
                      {t("save")}
                    </button>
                  </>
                }
              </div>

              <ShareLinkDialog title={t("share")} link={endPoint + "/portfolio/" + profile.id} />
            </>
          )
        }
      </Await>
    </Suspense>
  )
}