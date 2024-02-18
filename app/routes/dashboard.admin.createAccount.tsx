import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddUserValidator } from "~/utils/validators";
import { useFetcher, useNavigate } from "@remix-run/react";
import { ActionArgs, json, redirect } from "@remix-run/node";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";
import { useService } from "~/services/services.server";
import { useEffect, useRef } from "react";
import { useToast } from "~/components/ui/use-toast";

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
    case 'add':
      const result = AddUserValidator.safeParse(Object.fromEntries(form))
      if (!result.success) return fault(ResultCode.FORM_INVALID)
      const user = await userService.getUserByEmail(result.data.email)
      if (user) {
        return fault(ResultCode.EMAIL_ALREADY_EXIST)
      }
      const roles = (form.get("roles") as unknown as string).split(",")
      await userService.insertUser(result.data.email, result.data.password, +result.data.active, roles)
      return json({ code: ResultCode.OK })
  }
}

export default function Page () {
  const fetcher = useFetcher()
  const { toast } = useToast()
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && fetcher.data?.code === ResultCode.EMAIL_ALREADY_EXIST) {
      toast({
        description: '用户已存在'
      })
    }
    if (fetcher.state === 'idle' && fetcher.data && fetcher.data?.code === ResultCode.OK) {
      navigate(-1)
    }
  }, [fetcher])
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(AddUserValidator),
    mode: 'onSubmit'
  })

  const navigate = useNavigate()

  const roles = useRef<string[]>([])

  return (
    <div className="flex justify-center items-center h-screen mt-[-10rem]">
      <form className="flex flex-col gap-3 w-96" onSubmit={handleSubmit(data => {
        const r = Array.from(new Set(roles.current ?? []))
        fetcher.submit({ ...data, roles: r.join(","), active: +data.active, _action: 'add' }, { method: 'POST' })
      })}>
        <h3 className="text-xl py-3 font-bold flex justify-center">Create Account</h3>

        <div className="flex flex-col gap-1">
          {
            errors.email &&
            <p>{errors.email?.message as string}</p>
          }
          <div className="grid grid-cols-6">
            <label className="flex items-center">{t('admin.user.email')}</label>
            <input
              className={`input col-span-5 input-bordered w-full input-sm ${errors.email?.message ? "input-error" : ""}`}
              {...register("email")} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {
            errors.password &&
            <p>{errors.password?.message as string}</p>
          }
          <div className="grid grid-cols-6">
            <label className="flex items-center">{t('admin.user.password')}</label>
            <input
              className={`input col-span-5 input-bordered w-full input-sm ${errors.password?.message ? "input-error" : ""}`}
              type="password"
              {...register("password")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 py-2 px-3 rounded-md border border-base-300 text-sm">
          <h3 className="text-lg font-semibold col-span-2">Active Account & Set Account Roles</h3>
          <div className="grid grid-cols-2">
            <label className="flex items-center">Active</label>
            <input type="checkbox" className="toggle toggle-sm toggle-primary" {...register("active")} defaultChecked={true} />
          </div>

          <div className="grid grid-cols-2">
            <label className="flex items-center">Consumer</label>
            <input type="checkbox"
              onChange={event => {
                if (event.target.checked) {
                  roles.current.push(Roles.CONSUMER)
                } else {
                  roles.current = roles.current.filter(role => role !== Roles.CONSUMER)
                }
              }}
              className="toggle toggle-sm toggle-secondary" defaultChecked={false} />
          </div>

          <div className="grid grid-cols-2">
            <label className="flex items-center">Designer</label>
            <input type="checkbox"
              onChange={event => {
                if (event.target.checked) {
                  roles.current.push(Roles.PRO)
                } else {
                  roles.current = roles.current.filter(role => role !== Roles.PRO)
                }
              }}
              className="toggle toggle-sm toggle-accent" defaultChecked={false} />
          </div>

          <div className="grid grid-cols-2">
            <label className="flex items-center">Back Admin</label>
            <input type="checkbox"
              onChange={event => {
                if (event.target.checked) {
                  roles.current.push(Roles.BACK_ADMIN)
                } else {
                  roles.current = roles.current.filter(role => role !== Roles.BACK_ADMIN)
                }
              }}
              className="toggle toggle-sm toggle-error" defaultChecked={false} />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button className="btn btn-sm btn-ghost" onClick={() => {
            navigate(-1)
          }}>{t('cancel')}
          </button>
          <button className="btn btn-sm btn-primary" type="submit">{t('save')}</button>
        </div>
      </form>
    </div>
  )
}