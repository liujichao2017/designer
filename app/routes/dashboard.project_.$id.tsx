//@ts-nocheck
import { ActionArgs, LoaderArgs, defer, json, redirect } from "@remix-run/node"
import { Await, Link, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react"
import { Suspense, useEffect, useRef, useState } from "react"
import { z } from "zod"
import { ProjectCard } from "~/components/ui/Card"
import { OperatorHeader } from "~/components/layout/Header"
import { useService } from "~/services/services.server"
import { isAuthenticated } from "~/utils/sessions.server"
import { LoadingPlaceholder } from "~/components/ui/PlaceHolder"
import { useTranslation } from "react-i18next"
import Uploader, { FileContent, UploaderHandler } from "~/components/form/Uploader"
import { IdValidator, RenameValidator, UploadValidator } from "~/utils/validators"
import { ResultCode, fault } from "~/utils/result"
import { AnimatePresence, motion } from "framer-motion"
import UploaderDialog from "~/components/form/UploaderDialog"

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const id = parseInt(args.params.id as string)
  return defer({ books: useService("project", { user }).getProject(id), user, v1Url: process.env.V1_END_POINT })
}

type LoaderData = ReturnType<typeof loader>

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const form: z.infer<typeof UploadValidator> & { _action: string } = await args.request.json()
  const service = useService("project", { user })
  switch (form._action) {
    case "upload":
      {
        const result = await UploadValidator.safeParseAsync(form)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        await service.uploadBook(parseInt(args.params.id as string), user.id, result.data.contents)
        return json({ code: ResultCode.OK })
      }
    case "rename":
      {
        const result = RenameValidator.safeParse(form)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        await service.renameBook(result.data.id, result.data.name)
        return json({ code: ResultCode.OK })
      }
    case "remove":
      {
        const result = IdValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        await service.removeBook(result.data.id)
        return json({ code: ResultCode.OK })
      }
  }
}

export default () => {
  const { books, v1Url } = useLoaderData<LoaderData>()
  const fetcher = useFetcher()
  const nav = useNavigate()
  const [current, setCurrent] = useState()
  const nameRef = useRef(null)
  const { t } = useTranslation()
  const { id } = useParams()

  const upload = (files: FileContent[]) => {
    fetcher.submit(
      { _action: "upload", contents: files.map(d => d.src) },
      { method: "post", encType: "application/json" }
    )
  }

  // useEffect(() => {
  //   if (fetcher.state === "idle" && fetcher.data?.code === ResultCode.OK) {
  //     nav(".", { replace: true })
  //   }
  // }, [fetcher])

  const handleRename = (id: number, name: string) => {
    fetcher.submit({ _action: "rename", id, name }, { method: "post", encType: "application/json" })
  }

  const handleDelete = (id: number) => {
    fetcher.submit({ _action: "remove", id }, { method: "post", encType: "application/json" })
  }

  return (
    <div className="flex flex-col gap-2">

      <OperatorHeader title={
        <span onClick={event => nav(-1)} className="flex gap-1 items-center cursor-pointer" replace={true} prefetch="intent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
          </svg>
          {t("demand.back")}
        </span>
      }>
        <div>
          <button className="btn btn-primary btn-sm" onClick={_ => {
            (window as any)?.uploaderDialog?.showModal()
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {t("upload")}
          </button>
        </div>
      </OperatorHeader>

      <UploaderDialog upload={upload} allowedTypes={["image/png", "image/jpeg", "application/pdf"]} />
      <dialog id="renameDialog" className="modal" >
        <form method="dialog" className="modal-box" onSubmit={_ => {
          handleRename(current?.id as number, nameRef.current?.value as string)
        }}>
          <h3 className="font-bold text-lg">{t("project.renameProject")}</h3>
          <div className="py-4 form-control">
            <label className="label">{t("project.enterNewName")}</label>
            <input type="text" ref={nameRef} className="input input-bordered" name="name" defaultValue={current && current.project_name || ""} />
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
        <form method="dialog" className="modal-box" onSubmit={_ => handleDelete(current?.id as number)}>
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

      <div className="flex flex-wrap gap-4">
        <Suspense fallback={<LoadingPlaceholder />}>
          <AnimatePresence>
            <Await resolve={books}>
              {
                (books) => (
                  <>
                    {
                      books.map((book, i) =>
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, rotate: 0 }}
                        >
                          <ProjectCard {...book}
                            cover={book.pages[0]?.litpic_url as string}
                            name={book.project_name as string}
                            createdAt={book.created_at as string}
                            next={`/project/${id}/detail/${book.id}`}
                            // next={v1Url + "/project/detail?id=" + book.id}
                            edit={() => {
                              setCurrent(book)
                              setTimeout(() => {
                                nameRef.current!.value = book.project_name as string
                                nameRef.current?.select()
                              }, 10);
                              (window as any)?.renameDialog?.showModal()
                            }}
                            delete={() => {
                              setCurrent(book);
                              (window as any)?.deleteDialog?.showModal()
                            }}
                          />
                        </motion.div>
                      )
                    }
                  </>
                )
              }
            </Await>
          </AnimatePresence>
        </Suspense>
      </div>
      <fetcher.Form></fetcher.Form>
    </div >
  )
}
