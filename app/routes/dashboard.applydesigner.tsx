//@ts-nocheck
import { LoaderArgs, redirect, defer, ActionArgs, json } from "@remix-run/node"
import { Link, useParams } from "@remix-run/react"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Await, useLoaderData, useNavigate } from "react-router"
import { useFetcher } from "react-router-dom"
import ExperienceForm from "~/components/form/ExperienceForm"
import ProfileBaseForm from "~/components/form/ProfileBaseForm"
import UploaderDialog from "~/components/form/UploaderDialog"
import { EditableAvatar } from "~/components/ui/Avatar"
import ExperienceList, { ExperienceList2 } from "~/components/ui/ExperienceList"
import { LoadingPlaceholder } from "~/components/ui/PlaceHolder"
import PortfolioPictureList, { PortfolioPictureList2 } from "~/components/ui/PortfolioPictureList"
import SkillList from "~/components/ui/SkillList"
import { cn } from "~/lib/utils"
import { useService } from "~/services/services.server"
import { ResultCode } from "~/utils/result"
import { hasRole, isAuthenticated } from "~/utils/sessions.server"
import { Roles, useUserState } from "~/utils/store"
import { ExperienceValidator, IdValidator, NameValidator, ProfileBaseValidator, UploadValidator } from "~/utils/validators"

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isPro = await hasRole(Roles.PRO, args)
  const service = useService("profile", { user })
  const id = args.params.id || user.id
  const apply = await useService("notify", { user }).getApplyDesigner()
  return defer({ profile: service.getAllProfile(Number(id)), apply, isPro })
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
        await service.saveBase(result.data.name, result.data.description, +result.data.gender, result.data.phone, result.data.country)
        await useService("notify", { user }).applyDesigner()
        return json({ code: ResultCode.OK, applyStep: 1 })
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
    case "reapply":
      {
        await useService("notify", { user }).removeApply()
        return json({ code: ResultCode.OK })
      }
  }
}

export default function Page () {
  const { profile, apply, isPro } = useLoaderData<typeof loader>()
  const mutation = useFetcher()
  const setAvatar = useUserState((s) => s.setAvatar)
  const [openExperience, setOpenExperience] = useState(false)
  const { id } = useParams()
  const { t } = useTranslation()
  const [base, setBase] = useState<{ name: string, description: string, phone: string, gender: string, country: string }>()

  const active = useRef("text-primary border-b-2 border-primary font-semibold p-2 text-xs")
  const normal = useRef("text-opacity-60 font-semibold p-2 text-xs border-b-2 border-primary/0")

  const [tab, setTab] = useState(1)

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

  const reapply = () => {
    mutation.submit({ _action: "reapply" }, { method: "post", encType: "application/json" })
  }

  return (
    <div className="flex justify-center ">

      <div className="flex flex-col gap-6 items-center">
        <h3 className="text-xl font-semibold">{t("apply.title")}</h3>

        <ul className="steps steps-horizontal">
          <li className="step w-32 md:w-52 step-primary">{t("apply.requirement")}</li>
          <li className={`step w-32 md:w-52 ${apply && "step-primary"}`}>{t("apply.waitingReview")}</li>
          <li className={`step w-32 md:w-52 ${isPro && "step-primary"}`}>{t("apply.success")}</li>
        </ul>



        <div className="flex flex-col gap-4 w-full md:w-[58rem] p-10 mt-8">
          {
            isPro &&
            <div className="flex justify-center text-lg font-semibold">
              Congratulations on becoming a pro designer
            </div>
          }
          {
            apply && !isPro &&
            <div div className="flex flex-col gap-2 items-center text-center">
              <span className="text-lg font-bold">
                {t("apply.submitted")}
              </span>
              <button className="btn btn-primary btn-sm" onClick={reapply}>
                {t("apply.rewrite")}
              </button>
              <span className="divider"></span>
              <span className="text-sm opacity-50">
                {t("apply.contact")}
              </span>
              <a href="mailto:info@definertech.com" className="link link-primary">
                info@definertech.com
              </a>

            </div>
          }
          {
            !apply && !isPro &&
            <Suspense Suspense fallback={<LoadingPlaceholder />}>
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

                            onChange={(data: Record<string, string>) => {
                              setBase(prev => ({ ...prev, ...data }))
                            }} />
                        </div>
                      </div>

                      {/* <div>
                        <ExperienceList experiences={profile?.experiences}
                          add={() => { setOpenExperience(prev => !prev) }}
                          remove={(id: number) => { mutation.submit({ _action: "removeExperience", id }, { method: "post", encType: "application/json" }) }} />
                        {openExperience && <ExperienceForm cancel={() => { setOpenExperience(false) }} />}
                      </div> */}

                      <div>
                        <SkillList
                          skills={profile?.skills.map(val => val.skill)}
                          remove={(id: number) => {
                            mutation.submit({ _action: "removeSkill", id }, { method: "post", encType: "application/json" })
                          }}
                          add={(name: string) => {
                            mutation.submit({ _action: "addSKill", name }, { method: "post", encType: "application/json" })
                          }} />
                      </div>

                      <div className="flex gap-4 justify-center lg:justify-start bg-base-100 p-4 mt-4 border-solid border">
                        <button
                          onClick={_ => setTab(1)}
                          className={tab === 1 ? active.current : normal.current}>
                          {t("userPortfolio.project")}
                        </button>
                        <button
                          onClick={_ => setTab(2)}
                          className={tab === 2 ? active.current : normal.current}>
                          {t("userPortfolio.work")}
                        </button>
                      </div>

                      <div className={cn(tab === 1 ? "block" : "hidden")}>
                        <UploaderDialog upload={upload} name="portfolioUploader" />
                        <PortfolioPictureList2 pictures={profile?.portfolios}
                          add={() => { window?.portfolioUploader.showModal() }} editable={!id}
                          remove={(id: number) => {
                            mutation.submit({ _action: "removePortfolio", id }, { method: "post", encType: "application/json" })
                          }} />
                      </div>

                      <div className={cn("bg-base-100 p-6", tab === 2 ? "block" : "hidden")}>
                        <ExperienceList2 experiences={profile?.experiences} editable={!id}
                          add={() => { setOpenExperience(prev => !prev) }}
                          remove={(id: number) => { mutation.submit({ _action: "removeExperience", id }, { method: "post", encType: "application/json" }) }} />
                        {openExperience && <ExperienceForm cancel={() => { setOpenExperience(false) }} />}
                      </div>


                      <div className="flex justify-end gap-2 bg-base-100 p-4 rounded-t-lg w-full mt-10">
                        {
                          <>
                            <Link to="/portfolio/main/project" className="btn btn-ghost">{t("cancel")}</Link>
                            <button className="btn btn-primary" onClick={
                              () => {
                                mutation.submit({ _action: "saveBase", ...base }, { method: "post", encType: "application/json" })
                              }
                            }>
                              {t("demand.next")}
                            </button>
                          </>
                        }
                      </div>

                    </>
                  )
                }
              </Await>
            </Suspense>
          }
        </div>

      </div >


    </div >
  )
}