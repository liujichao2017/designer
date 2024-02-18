import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { EmailValidator } from "~/utils/validators"
import { InputError } from "../ui/Errors"
import { useCallback } from "react"

export default function ({submit}: {submit: (email:string) => void}) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(EmailValidator), mode: "onChange" })

  const handler = useCallback(handleSubmit(data => {
    submit(data.email)
  }), [])
  return (
    <form onSubmit={handler} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text text-base font-semibold">{t("auth.email")}</span>
          <InputError hidden={!errors.email} error={errors.email?.message as string} />
        </label>
        <input {...register("email")}
          placeholder="@Email address"
          className={`input input-bordered w-full ${errors.email?.message ? "input-error" : ""}`} />
      </div>
      <div className="form-control pt-1">
        <button type="submit" className="btn btn-primary">{t("auth.sendResetEmail")}</button>
      </div>
    </form>
  )
}