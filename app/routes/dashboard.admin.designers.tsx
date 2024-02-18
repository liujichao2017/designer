//@ts-nocheck
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NotifyPassValidator, NotifyRejectValidator } from "~/utils/validators";
import { groupBy } from "~/utils/helpers";
import Avatar from "~/components/ui/Avatar";

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const notifyService = useService('notify')
  let notifyList = await notifyService.getNotifyList(0)
  const list = groupBy(notifyList, (item) => {
    return item.to ? item.to + "" : ""
  })

  console.log(list)

  return json({ list: Object.entries(list).map(([_, v]) => v.length && v[0]) })
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
  const { request } = args
  const formData = await request.formData()
  const _action = formData.get('_action')
  const roleService = useService('role')
  const userRoleService = useService('userRole')
  const notifyService = useService('notify')
  const primeService = useService('prime')
  const roleId = await roleService.getProId()
  switch (_action) {
    case 'pass':
      const passResult = NotifyPassValidator.safeParse(Object.fromEntries(formData))
      if (!passResult) return fault(ResultCode.FORM_INVALID)
      await userRoleService.insertProUserRole(+passResult.data.userId, roleId, +passResult.data.level)

      await notifyService.approvePro(+passResult.data.userId)
      await primeService.insertPrime(+passResult.data.userId, 3)
      await notifyService.deleteProNotify(+passResult.data.userId)
      return json({ code: ResultCode.OK })
    case 'reject':
      const rejectResult = NotifyRejectValidator.safeParse(Object.fromEntries(formData))
      if (!rejectResult) return fault(ResultCode.FORM_INVALID)
      await notifyService.rejectPro(+rejectResult.data.userId)
      await notifyService.deleteProNotify(+rejectResult.data.userId)
      return json({ code: ResultCode.OK })
  }
}

export default () => {
  const { list } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const level = [0, 1, 2, 3, 4, 5, 6, 7]
  const { setValue: notifyPassSetValue, register: notifyPassRegister, handleSubmit: notifyHandleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(NotifyPassValidator),
    mode: 'onSubmit'
  })
  const { setValue: notifyRejectSetValue, register: notifyRejectRegister, handleSubmit: notifyRejectHandleSubmit } = useForm({
    resolver: zodResolver(NotifyRejectValidator),
    mode: 'onSubmit'
  })

  return (<div>
    {list.map((value) => {
      if (!value.owner) {
        console.log(value)
        return <></>
      }
      return (<div className="flex justify-between mt-2.5 p-4 rounded-lg bg-base-100" key={value.id}>
        <div className="flex">
          <Avatar user={value.owner} />
          <div className="ml-2.5">
            <div className="leading-6">{value?.owner?.name}</div>
            <div className="leading-6">{value?.owner?.email}</div>
          </div>
        </div>
        <div className="flex items-center">
          <a className="btn btn-sm" href={`/portfolio/${value?.owner?.id}`}>{t("demandorder.info.detail")}</a>
          <a className="btn btn-sm btn-secondary ml-2.5" onClick={() => {
            notifyRejectSetValue('userId', value?.owner?.id + "")
            rejectModal.showModal()
          }}>{t("demandorder.info.reject")}</a>
          <a className="btn btn-sm btn-accent ml-2.5" onClick={() => {
            console.log(value?.owner?.id)
            notifyPassSetValue('userId', value?.owner?.id + "")
            passModal.showModal()
          }}>{t("demandorder.info.accept")}</a>
        </div>
      </div>)
    })}

    <dialog id="passModal" className="modal">
      <div className="modal-box">
        <form onSubmit={notifyHandleSubmit((data) => {
          fetcher.submit({ ...data }, { method: 'POST' })
          passModal.close()
        })}>
          <input type="hidden" {...notifyPassRegister('userId')} />
          <input type="hidden" {...notifyPassRegister('_action')} defaultValue="pass" />
          <h3 className="font-bold text-lg">{t('admin.designer.reviewDesigner')}</h3>
          <div className="py-4">
            <ul>
              <li className="flex mt-2.5">
                <label className="w-24 leading-8">{t('admin.picture.level')}</label>
                <div className="flex-1 h-8">
                  <select className="select select-bordered w-full min-h-0 h-full" {...notifyPassRegister('level')}>
                    {level.map((value, index) => {
                      return (<option value={value} key={index}>{value}</option>)
                    })}
                  </select>
                </div>
              </li>
            </ul>
          </div>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              passModal.close()
            }}>{t("cancel")}</a>
            <button className="btn btn-primary" type="submit">{t("ok")}</button>
          </div>
        </form>
      </div>
    </dialog>
    <dialog id="rejectModal" className="modal">
      <div className="modal-box">
        <form onSubmit={notifyRejectHandleSubmit((data) => {
          console.log("submit")
          fetcher.submit({ ...data }, { method: 'POST' })
          rejectModal.close()
        })}>
          <input type="hidden" {...notifyRejectRegister('userId')} />
          <input type="hidden" {...notifyRejectRegister('_action')} defaultValue="reject" />
          <h3 className="font-bold text-lg">{t('admin.designer.reviewDesigner')}</h3>
          <p className="py-4">{t('admin.picture.confirmReject')}</p>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              rejectModal.close()
            }}>{t("cancel")}</a>
            <button className="btn btn-primary" type="submit">{t("ok")}</button>
          </div>
        </form>
      </div>
    </dialog>
  </div>)
}