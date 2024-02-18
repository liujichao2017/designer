import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import dayjs from "dayjs";
import { t } from "i18next";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";
import { useEffect } from "react";
import Pagination from "~/components/ui/Pagination";
import Avatar from "~/components/ui/Avatar";

let deleteId: number = 0

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const { request } = args
  const { searchParams } = new URL(request.url)
  const page = +(searchParams.get("page") ?? "1")
  const demandService = useService('demand')
  const userService = useService('user')
  const data = await demandService.getDemandList(page)

  return json({ ...data, code: ResultCode.OK })
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
  const demandService = useService('demand')
  const { request } = args
  const formData = await request.formData()
  const _action = formData.get('_action')
  const id = Number(formData.get('id'))
  switch (_action) {
    case 'unlock':
      // await userService.lockAdminUser(id, 1)
      return json({ code: ResultCode.OK })
    case 'delete':
      await demandService.deleteDemand(id)
      return json({ code: ResultCode.OK })
  }
}

export default () => {
  const { demands, pages, code } = useLoaderData<typeof loader>()

  console.log(demands)
  const fetcher = useFetcher()
  const [searchParams, _] = useSearchParams()
  const page = +(searchParams.get("page") ?? 1)

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && fetcher.data?.code === ResultCode.OK) {
    }
  }, [fetcher])

  const deleteHandle = () => {
    fetcher.submit({ _action: 'delete', id: deleteId }, { method: 'POST' })
    deleteId = 0
    deleteModal.close()
  }

  return (<div className="p-6 rounded-md bg-base-100">
    <table className="table mt-2.5">
      <thead>
        <tr>
          <th align="center">{t('demand.id')}</th>
          <th align="center">{t('demand.name')}</th>
          <th>{t('demand.email')}</th>
          <th>{t('demand.services')}</th>
          <th>{t("demand.type")}</th>
          <th align="center">{t('demand.createTime')}</th>
          <th align="center">{t('designer')}</th>
          <th align="center">{t('admin.user.operation')}</th>
        </tr>
      </thead>
      <tbody>
        {
          demands.map((value, key) => {
            return (
              <tr key={key}>
                <th align="center">{"QU-" + value.id}</th>
                <td align="center">{value.name}</td>
                <td>{value.email}</td>
                {/* <td>{value.remark && value.remark !== "undefined" || ""}</td> */}
                <td>{t("demand.servicesItem." + value.services)}</td>
                <td>{t("demand.typeItem." + value.type)}</td>
                <td align="center">{value.created_at ? dayjs(value.created_at).format('YYYY-MM-DD hh:ss:mm') : ''}</td>
                <td align="center">
                  {value.designer && value.designer.name ? (
                    <Link to={"/portfolio/main/" + value.designer.id + "/project"} className="flex items-center justify-center">
                      <Avatar user={value.designer} size="sm" />
                    </Link>
                  ) : ''}
                </td>
                <td>
                  <div className="flex justify-center items-center">
                    <Link to={`/dashboard/admin/work/${value.id}/detail`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </Link>

                    <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {
                      deleteId = value.id
                      deleteModal.showModal()
                    }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </div>
                </td>
              </tr>
            )
          })
        }
      </tbody>
    </table>

    <div className="join pb-4 flex justify-center mt-4">
      <Pagination
        totalPages={pages}
        showDirection={true}
        currentPage={page ? +page : 1}
        linkGenerator={(page: number) => {
          const sp = new URLSearchParams(searchParams.toString())
          sp.set("page", page + "")
          return "/dashboard/admin/works?" + sp.toString()
        }}
      />
    </div>

    <dialog id="deleteModal" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{t('tip.title')}</h3>
        <p className="py-4">{t('tip.delete')}</p>
        <div className="modal-action">
          <a className="btn" onClick={() => {
            deleteId = 0
            deleteModal?.close()
          }}>{t("cancel")}</a>
          <button className="btn btn-primary" onClick={() => {
            deleteHandle()
          }}>{t("ok")}
          </button>
        </div>
      </div>
    </dialog>
  </div>)
}