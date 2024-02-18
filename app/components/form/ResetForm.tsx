import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ChangePasswordValidator } from "~/utils/validators"
import { InputError } from "../ui/Errors"
import { useCallback } from "react"

export default function ({ submit }: { submit: (email: string) => void }) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(ChangePasswordValidator), mode: "onChange" })

  const handler = useCallback(handleSubmit(data => {
    submit(data.newPassword)
  }), [])
  return (
    <form onSubmit={handler} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text text-base font-semibold">{t("auth.password")}</span>
          <InputError hidden={!errors.newPassword} error={errors.newPassword?.message as string} />
        </label>
        <input {...register("newPassword")}
          type="password"
          placeholder="New password"
          className={`input input-bordered w-full ${errors.newPassword?.message ? "input-error" : ""}`} />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-base font-semibold">Repeat password</span>
          <InputError hidden={!errors.repeatPassword} error={errors.repeatPassword?.message as string} />
        </label>
        <input {...register("repeatPassword")}
          type="password"
          placeholder="Repeat password"
          className={`input input-bordered w-full ${errors.repeatPassword?.message ? "input-error" : ""}`} />
      </div>

      <div className="form-control">
        <InputError hidden={!errors.password} error={errors.password?.message as string} />
      </div>

      <div className="form-control pt-1">
        <button type="submit" className="btn btn-primary">{t("auth.resetPassword")}</button>
      </div>
    </form>
  )
}