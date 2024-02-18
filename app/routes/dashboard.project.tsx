import { ActionArgs, LoaderArgs, defer, json, redirect } from "@remix-run/node"
import { Await, useFetcher, useLoaderData } from "@remix-run/react"
import { Suspense, useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PainCard, ProjectCard } from "~/components/ui/Card"
import { PageError } from "~/components/ui/Errors"
import { OperatorHeader } from "~/components/layout/Header"
import { LoadingPlaceholder } from "~/components/ui/PlaceHolder"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { isAuthenticated } from "~/utils/sessions.server"
import { CreateProjectValidator, IdValidator, RenameValidator } from "~/utils/validators"
import { AnimatePresence, motion } from "framer-motion"
import ShareLinkDialog from "~/components/form/ShareLinkDialog"

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const projects = await useService("project", { user }).list()
  return defer({ projects })
}

export const action = async (args: ActionArgs) => {
  const { request } = args
  const user = await isAuthenticated(args)
  if (!user) {
    return redirect("/auth/signin")
  }
  const form = await request.formData()
  const _action = form.get("_action")
  const service = useService("project", { user })

  switch (_action) {
    case "rename":
      {
        const result = await RenameValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.rename(result.data.id, result.data.name))
      }
    case "delete":
      {
        const result = await IdValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.delete(result.data.id))
      }
    case "create":
      {
        const result = await CreateProjectValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.create(result.data.name))
      }
  }
}

export default () => {
  const { projects } = useLoaderData<typeof loader>()
  const [currentProject, setCurrentProject] = useState<Awaited<Promise<PromiseLike<typeof projects>>>[0]>()

  const fetcher = useFetcher()
  const query = useFetcher()
  const nameRef = useRef<HTMLInputElement>(null)
  const projectRef = useRef<HTMLInputElement>(null)

  const { t } = useTranslation()

  const handleRename = useCallback((id: number, name: string) => {
    const payload = { _action: "rename", id, name }
    if (name) {
      fetcher.submit(payload, { method: "post" })
      nameRef.current!.value = ""
    }
  }, [currentProject])

  const handleDelete = useCallback((id: number) => {
    fetcher.submit({ _action: "delete", id }, { method: "post" })
  }, [currentProject])

  const handleCreate = useCallback((name: string) => {
    fetcher.submit({ _action: "create", name }, { method: "post" })
    projectRef.current!.value = ""
  }, [currentProject])

  return (
    <div className="flex flex-col gap-2">
      <OperatorHeader title={t("nav.projects")}>
        <div>
          <button className="btn btn-primary btn-sm" onClick={_ => {
            (window as any)?.createDialog?.showModal()
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            {t("project.addProject")}
          </button>
        </div>
      </OperatorHeader>

      <dialog id="renameDialog" className="modal" >
        <form method="dialog" className="modal-box" onSubmit={_ => {
          handleRename(currentProject?.id as number, nameRef.current?.value as string)
        }}>
          <h3 className="font-bold text-lg">{t("project.renameProject")}</h3>
          <div className="py-4 form-control">
            <label className="label">{t("project.enterNewName")}</label>
            <input type="text" ref={nameRef} className="input input-bordered" name="name" />
          </div>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              (window as any)?.renameDialog?.close()
            }}>{t("cancel")}</a>
            <button type="submit" className="btn btn-primary">{t("ok")}</button>
          </div>
        </form>
      </dialog>

      <dialog id="deleteDialog" className="modal">
        <form method="dialog" className="modal-box" onSubmit={_ => handleDelete(currentProject?.id as number)}>
          <h3 className="font-bold text-lg">{t("project.removeProject")}</h3>
          <p className="py-4">{t("project.removeWarning")}</p>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              (window as any)?.deleteDialog?.close()
            }}>{t("cancel")}</a>
            <button className="btn btn-primary">{t("ok")}</button>
          </div>
        </form>
      </dialog>

      <dialog id="createDialog" className="modal" >
        <form method="dialog" className="modal-box" onSubmit={_ => {
          handleCreate(projectRef.current?.value as string)
        }}>
          <h3 className="font-bold text-lg">{t("project.createProject")}</h3>
          <div className="py-4 form-control">
            <label className="label">{t("project.enterProjectName")}</label>
            <input type="text" ref={projectRef} className="input input-bordered" name="name" />
          </div>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              (window as any)?.createDialog?.close()
            }}>{t("cancel")}</a>
            <button type="submit" className="btn btn-primary">{t("ok")}</button>
          </div>
        </form>
      </dialog>

      <ShareLinkDialog title={t("project.shareProject")} link={query.data?.cipher ?? ""} />

      <fetcher.Form></fetcher.Form>

      <div className="flex flex-wrap gap-6">
        {
          projects.map((p, i) => (

            <PainCard
              id={p.id}
              cover={p.books[0]?.pages[0]?.litpic_url as string}
              name={p.project_name as string}
              author={p.owner?.name as string}
              createdAt={p.created_at as string}
              next={`/dashboard/project/${p.id}`}
              edit={() => {
                setCurrentProject(p)
                setTimeout(() => {
                  nameRef.current!.value = p.project_name as string
                  nameRef.current?.select()
                }, 10);
                (window as any)?.renameDialog?.showModal()
              }}
              delete={() => {
                setCurrentProject(p);
                (window as any)?.deleteDialog?.showModal()
              }}
              shared={() => {
                query.load("/api/share?_loader=project&id=" + p.id);
                (window as any)?.shareLinkDialog?.showModal()
              }}
            />
          ))
        }
      </div>
    </div >
  )
}