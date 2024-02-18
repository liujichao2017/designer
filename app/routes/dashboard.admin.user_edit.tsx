import { useService } from "~/services/services.server";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ChangeUserValidator, IdValidator } from "~/utils/validators";
import { fault, ResultCode } from "~/utils/result";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { useEffect } from "react";

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
  const url = new URL(request.url)
  const result = IdValidator.safeParse(Object.fromEntries(url.searchParams))
  if (!result.success) {
    return fault(ResultCode.FORM_INVALID)
  }
  const userService = useService('user')
  const userResult = await userService.getUser(result.data.id)
  return json({ user: userResult, code: ResultCode.OK })
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
  const userService = useService('user')
  const form = await request.formData()
  const _action = form.get('_action')
  switch (_action) {
    case 'edit':
      const formData = Object.fromEntries(form)
      const result = ChangeUserValidator.safeParse(formData)
      if (!result.success) return fault(ResultCode.FORM_INVALID)
      await userService.updateAdminUser(result.data, user)
      return json({ code: ResultCode.OK })
  }
}

export default () => {
  const { user, code } = useLoaderData<typeof loader>()
  if (!user.prime) {
    user.prime = {
      type: 0
    }
  }
  const fetcher = useFetcher()
  if (code == ResultCode.OK) {
    const primeOptions = [
      { type: 0, name: 'Free' },
      { type: 1, name: 'Basic' },
      { type: 2, name: 'Advanced' },
      { type: 3, name: 'Primium' }
    ]
    let roles: string[] = []
    user.roles.forEach((v: { role: { name: string; }; }) => {
      roles.push(v.role?.name || '')
    })
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(ChangeUserValidator),
      mode: 'onSubmit'
    })

    useEffect(() => {
      if (fetcher.state === 'idle' && fetcher.data && fetcher.data?.code === ResultCode.OK) {
        window.history.back()
      }
    }, [fetcher])

    return (
      <div className="flex flex-col bg-base-100 rounded-lg p-4">
        <form id="form"
          className="p-4"
          onSubmit={handleSubmit(data => {
            fetcher.submit({ ...data, _action: 'edit' }, { method: 'POST' })
          })}>
          <input
            type="hidden"
            defaultValue={user.id}
            {...register("id")} />
          <ul className="mt-5">
            <li className="flex">
              <label className="inline-flex leading-8 h-8 w-20 justify-end pr-2.5">{t('admin.user.name')}</label>
              <div className="h-8 flex-1">
                <input
                  className={`input input-bordered h-full w-full ${errors.name?.message ? "input-error" : ""}`}
                  defaultValue={user.name}
                  {...register("name")} />
              </div>
            </li>
            <li className="min-h-8 pl-20 text-sm text-error"><p className="py-2.5">{errors.name?.message as string}</p></li>
            <li className="flex">
              <label className="inline-flex leading-8 h-8 w-20 justify-end pr-2.5">{t('admin.user.email')}</label>
              <div className="h-8 flex-1">
                <input
                  className={`input input-bordered h-full w-full ${errors.email?.message ? "input-error" : ""}`}
                  defaultValue={user.email}
                  {...register("email")} />
              </div>
            </li>
            <li className="min-h-8 pl-20 text-sm text-error"><p className="py-2.5">{errors.email?.message as string}</p></li>
            <li className="flex">
              <label className="inline-flex leading-8 h-8 w-20 justify-end pr-2.5">{t('admin.user.password')}</label>
              <div className="h-8 flex-1">
                <input
                  className={`input input-bordered h-full w-full ${errors.password?.message ? "input-error" : ""}`}
                  type="password"
                  {...register("password")} />
              </div>
            </li>
            <li className="min-h-8 pl-20 text-sm text-error"><p className="py-2.5">{errors.password?.message as string}</p></li>
            <li className="flex">
              <label className="inline-flex h-8 w-20 justify-end pr-2.5">{t('admin.user.primeStatus')}</label>
              <div className="">
                {primeOptions.map((value, index) => {
                  return (<div className={`flex items-center ${index == 0 ? '' : 'mt-2.5'}`} key={index}>
                    <input type="radio"
                      defaultChecked={user.prime.type == value.type}
                      defaultValue={value.type}
                      className="radio-xs"
                      {...register("prime")} />
                    <label className="ml-2.5">{value.name}</label>
                  </div>)
                })}
              </div>
            </li>
            <li className="min-h-8 pl-20 text-sm text-error"><p className="py-2.5">{errors.prime?.message as string}</p></li>
            <li className="flex">
              <label className="inline-flex h-8 w-20 justify-end pr-2.5 flex-none">{t('admin.user.roles')}</label>
              <div className="">
                <div className="">
                  <div className="flex items-center">
                    <input type="checkbox" className="checkbox-xs flex-none" {...register("isPro")} defaultValue="pro" defaultChecked={roles.includes('pro')} />
                    <label className="ml-2.5">Pro Designer</label>
                  </div>
                  <div className="flex items-center mt-2.5">
                    <input type="checkbox" className="checkbox-xs flex-none" {...register("isConsumer")} defaultValue="tag" defaultChecked={roles.includes(Roles.CONSUMER)} />
                    <label className="ml-2.5">Consumer</label>
                  </div>
                  <div className="flex items-center mt-2.5">
                    <input type="checkbox" className="checkbox-xs flex-none" {...register("isTag")} defaultValue="tag" defaultChecked={roles.includes('tag')} />
                    <label className="ml-2.5">Tag Only</label>
                  </div>
                  <div className="flex mt-2.5">
                    <input type="checkbox" className="checkbox-xs flex-none" {...register("isBackAdmin")} defaultValue="backAdmin" defaultChecked={roles.includes('backAdmin')} />
                    <label className="ml-2.5">
                      <span>Back Admin</span>
                      <span>(Warning, Backadmin has the highest permissions and can delete or modify any data)</span>
                    </label>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-8 pl-20 text-sm text-error"></li>
            <li className="flex">
              <label className="inline-flex leading-8 h-8 w-20 justify-end pr-2.5 flex-none">{t('admin.user.score')}</label>
              <div className="flex">
                <input className="input input-bordered h-full w-full" defaultValue={user.score} {...register("score")} />
                <div className="ml-2.5 w-44 leading-8">(0 - 10)</div>
              </div>
            </li>
            <li className="min-h-8 pl-20 text-sm text-error"><p className="py-2.5">{errors.score?.message as string}</p></li>
            <li className="pl-20">
              <button className="btn btn-sm btn-primary" type="submit">{t('save')}</button>
              <a className="btn btn-sm ml-5" onClick={() => {
                window.history.back()
              }}>{t('cancel')}
              </a>
            </li>
          </ul>
        </form>
      </div>)
  } else {
    return (<div className="mt-5 text-center">{t(`errors.${code}`)}</div>)
  }
}