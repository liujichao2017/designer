import { Link } from "@remix-run/react"
import { useFetcher } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ResultCode } from "~/utils/result"

import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { FormError, InputError } from "../ui/Errors"
import { SignupValidator } from "~/utils/validators"

export default () => {
  const fetcher = useFetcher()
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(SignupValidator), mode: "onChange" })

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.code === ResultCode.OK) {
      (window as any).successDialog.showModal()
    }
  }, [fetcher])

  return (
    <>
      <form
        className="flex flex-col gap-3 lg:w-[36rem] w-full"
        onSubmit={handleSubmit(data => {
          fetcher.submit(data, { action: "/auth/signup", method: "post" })
        })}
      >
        {
          errors.name?.message &&
          <InputError error={errors.name?.message as string} />
        }
        <input
          placeholder="Enter your name"
          {...register("name")}
          className={`input input-bordered w-full ${errors.name?.message ? "input-error" : ""}`} />

        {
          errors.email?.message &&
          <InputError error={errors.email?.message as string} />
        }
        <input type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={`input input-bordered w-full ${errors.email?.message ? "input-error" : ""}`} />

        {
          errors.password?.message &&
          <InputError error={errors.password?.message as string} />
        }
        <input type="password"
          {...register("password")}
          placeholder="Password"
          className={`input input-bordered w-full ${errors.password?.message ? "input-error" : ""}`} />

        <div className="flex gap-2 items-center">
          <input type="checkbox"
            defaultChecked
            {...register("agreement")}
            className={`checkbox checkbox-xs ${errors.agreement?.message ? "checkbox-error" : ""}`} />
          <span>
            我已閱讀並接受
            <a className="link link-info">條款和條件</a>

            {
              errors.agreement?.message &&
              <InputError error={errors.agreement?.message as string} />
            }
          </span>
        </div>

        <div>
          {fetcher.state === "idle" && fetcher.data?.code && fetcher.data?.code !== ResultCode.OK &&
            <FormError code={fetcher.data?.code as number} />
          }
        </div>

        <button
          className={`btn btn-primary ${fetcher.state === "submitting" && "btn-disabled"}`}>
          {t("auth.signup")}
        </button>

      </form>

      <fetcher.Form></fetcher.Form>

      <dialog id="successDialog" className="modal">
        <form method="dialog" className="modal-box">
          <h3 className="font-bold text-lg">Create account success</h3>
          <p className="py-4">Check your email, there is an activation account link, and then sign in</p>
          <div className="modal-action">
            <Link to="/auth/signin" className="btn btn-outline">Sign in</Link>
          </div>
        </form>
      </dialog>
    </>

  )
}