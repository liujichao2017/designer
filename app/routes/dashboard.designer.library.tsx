import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node"
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { PhotoProvider } from "react-photo-view"
import { FileContent } from "~/components/form/Uploader"
import UploaderDialog from "~/components/form/UploaderDialog"
import Pagination from "~/components/ui/Pagination"
import PictureItem from "~/components/ui/PictureItem"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { hasRole, isAuthenticated } from "~/utils/sessions.server"
import { Roles, UserProps } from "~/utils/store"
import { UploadValidator } from "~/utils/validators"

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const isPro = await hasRole(Roles.PRO, args)
  if (!isPro) return json({ code: ResultCode.PERMISSION_DENIED, pages: 0, pictures: [], user: {} })
  const { searchParams } = new URL(args.request.url)
  const filter = searchParams.get("filter")
  const status = filter ? +filter : -1
  let page = searchParams.get("page")
  const data = await useService("picture", { user }).getDesignerPublicPictures(page ? +page : 1, status)
  return json({ code: ResultCode.OK, user, ...data })
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const isPro = await hasRole(Roles.PRO, args)
  if (!isPro) return fault(ResultCode.PERMISSION_DENIED)
  const data = await args.request.json()
  const { _action } = data
  switch (_action) {
    case "upload":
      {
        const result = UploadValidator.safeParse(data)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await useService("profile", { user }).uploadPortfolio(result.data.contents, true))
      }
  }
}

export default function Page () {
  const { code, pages, user, pictures } = useLoaderData<typeof loader>()
  if (code === ResultCode.PERMISSION_DENIED) {
    return (
      <div className="flex justify-center py-10 bg-error/50">
        <b className="font-bold text-lg">PERMISSION DENIED</b>
      </div>
    )
  }
  const { t } = useTranslation()
  const mutation = useFetcher()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get("filter")
  const status = filter ? +filter : -1
  let page = searchParams.get("page")

  const handleUpload = useCallback((files: FileContent[]) => {
    mutation.submit({ _action: "upload", contents: files.map(val => val.src) }, { method: "post", encType: "application/json" })
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 lg:gap-6 text-sm font-semibold">
          <span className={`${status === -1 ? "text-primary" : ""} cursor-pointer`}
            onClick={_ => setSearchParams(prev => {
              prev.set("filter", "-1")
              return new URLSearchParams(prev)
            })}
          >{t("all")}</span>
          <span className={`${status === 0 ? "text-primary" : ""} cursor-pointer`}
            onClick={_ => setSearchParams(prev => {
              prev.set("filter", "0")
              return new URLSearchParams(prev)
            })}
          >已批准</span>
          <span className={`${status === 1 ? "text-primary" : ""} cursor-pointer`}
            onClick={_ => setSearchParams(prev => {
              prev.set("filter", "1")
              return new URLSearchParams(prev)
            })}
          >未批准</span>
          <span className={`${status === 2 ? "text-primary" : ""} cursor-pointer`}
            onClick={_ => setSearchParams(prev => {
              prev.set("filter", "2")
              return new URLSearchParams(prev)
            })}
          >审核中</span>
        </div>

        <button onClick={_ => {
          (window as any).uploaderDialog.showModal()
        }} className="btn btn-primary btn-sm lg:px-8">{t("upload")}</button>
      </div>

      <div className="flex flex-wrap gap-8">
        <PhotoProvider>
          {
            pictures.map(pic => (
              <PictureItem
                key={pic.id}
                createdAt={pic.created_at ?? ""}
                id={pic.id}
                name={pic.project_name ?? ""}
                src={pic.img_url ?? ""}
                thumbnail={pic.litpic_url ?? ""}
                owner={user as UserProps}
                level={pic.level ?? 0}
              />
            ))
          }
        </PhotoProvider>
      </div>

      <div className="flex justify-center mt-8">
        <Pagination
          totalPages={pages}
          showDirection={true}
          currentPage={page ? +page : 1}
          linkGenerator={(page: number) => {
            const sp = new URLSearchParams(searchParams.toString())
            sp.set("page", page + "")
            return "/dashboard/designer/library?" + sp.toString()
          }}
        />
      </div>

      <UploaderDialog upload={handleUpload} />
    </div>
  )
}