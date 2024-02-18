import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFetcher } from "react-router-dom"
import { ResultCode } from "~/utils/result"

import { useTranslation } from "react-i18next"
import { InputError, FormError } from "../ui/Errors"
import { LocalSigninValidator } from "~/utils/validators"

import { useSearchParams } from '@remix-run/react'


export default () => {
  const fetcher = useFetcher()
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(LocalSigninValidator), mode: "onChange" })

  const [searchParams, _] = useSearchParams()

  return (
    <>
      <form className="flex flex-col gap-3"
        onSubmit={handleSubmit((data) =>
          fetcher.submit(data, { action: "/auth/signin1?" + searchParams.toString(), method: "post" })
        )}>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-base font-semibold">{t("auth.email")}</span>
            <InputError hidden={!errors.email} error={errors.email?.message as string} />
          </label>
          <input {...register("email")}
            placeholder="@Email address"
            className={`input input-bordered w-full ${errors.email?.message ? "input-error" : ""}`} />

        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-base font-semibold">{t("auth.password")}</span>
            <InputError hidden={!errors.password} error={errors.password?.message as string} />
          </label>
          <input {...register("password")}
            type="password"
            placeholder="Password"
            className={`input input-bordered w-full ${errors.password?.message ? "input-error" : ""}`} />
        </div>

        <input type="hidden" {...register("provider")} value="local" />

        <div>
          {fetcher.state === "idle" && fetcher.data?.code && fetcher.data?.code !== ResultCode.OK &&
            <FormError code={fetcher.data?.code as number} />
          }
        </div>

        <div className="form-control pt-1">
          <button type="submit" className="btn btn-primary">{t("auth.signin")}</button>
        </div>
      </form>
      <fetcher.Form></fetcher.Form>
    </>
  )
}