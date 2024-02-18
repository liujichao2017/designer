import { useService } from "~/services/services.server";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    throw redirect("/auth/logout")
  }
  const adminService = useService('admin');
  return json({
    list: await adminService.getProjects()
  })
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const projectListService = useService('projectList');
  const { request } = args
  const form = await request.formData()
  const _action = form.get('action')
  const id = form.get('id')
  const projectName = form.get('projectName')
  switch (_action) {
    case 'delete':
      await projectListService.deleteById(Number(id))
      return json({ code: ResultCode.OK })
    case 'rename':
      await projectListService.renameById(Number(id), projectName as string)
      return json({ code: ResultCode.OK })
  }
}



export default () => {
  const { list } = useLoaderData<typeof loader>()
  const fetch = useFetcher()
  const projectNameRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const targetId = useRef(-1)

  const showDeleteDialogHandle = (id: number) => {
    targetId.current = id
    //@ts-ignore
    deleteModal?.showModal()
  }

  const showRenameDialogHandle = (id: number) => {
    targetId.current = id
    //@ts-ignore
    renameModal?.showModal()
  }

  const deleteHandle = () => {
    fetch.submit({ action: 'delete', id: targetId.current }, { method: 'POST' })
  }

  const renameHandle = () => {
    const projectName = projectNameRef.current?.value ? projectNameRef.current?.value : ''
    fetch.submit({ action: 'rename', id: targetId.current, projectName: projectName }, { method: 'POST' })
  }

  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-2.5 gap-y-2.5 pb-2.5">
        {
          list.map((value, index) => {
            return (
              <div className="w-full bg-base-200 rounded-md p-2.5 cursor-pointer hover:shadow-lg duration-200 ease-in-out" key={index}>
                <Link to={"/dashboard/admin/projects/" + value.id}>
                  <div className="rounded-md aspect-square flex items-center p-2 justify-center">
                    {
                      value.books[0] ?
                        <img src={value.books[0]?.pages[0]?.litpic_url as string} className="object-cover" /> :
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 self-center">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    }
                  </div>
                </Link>

                <div className="mt-2.5">
                  <p className="leading-5 overflow-hidden text-overflow-ellipsis line-clamp-2 break-all h-10">{value.project_name}</p>
                  <div className="mt-2.5">
                    <div className="text-xs">
                      <Link to={"/portfolio/main/" + value.owner?.id + "/project"}>
                        {value.owner?.name}
                      </Link>
                      {dayjs(value.created_at).format('YYYY-MM-DD')}</div>
                  </div>
                </div>
                <div className="flex mt-2.5">
                  <button onClick={(e) => {
                    e.stopPropagation()
                    projectNameRef.current!.value = value.project_name ?? ""
                    showRenameDialogHandle(value.id)
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button className="ml-2.5" onClick={(e) => {
                    e.stopPropagation()
                    showDeleteDialogHandle(value.id)
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        <dialog id="deleteModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t("project.removeProject")}</h3>
            <p className="py-4">{t("project.removeWarning")}</p>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                deleteModal?.close()
              }}>{t("cancel")}</a>
              <button className="btn btn-primary" onClick={() => {
                deleteHandle()
                deleteModal?.close()
              }}>
                {t("ok")}
              </button>
            </div>
          </div>
        </dialog>
        <dialog id="renameModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t("project.renameProject")}</h3>
            <div className="py-4">
              <label className="label">{t("project.enterNewName")}</label>
              <input type="text" className="w-full input input-bordered" ref={projectNameRef} id={"projectName"} />
            </div>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                renameModal?.close()
              }}>{t("cancel")}</a>
              <button className="btn btn-primary" onClick={async () => {
                renameHandle()
                renameModal?.close()
              }}>{t("ok")}
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  )
}