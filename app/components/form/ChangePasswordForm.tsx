import { useFetcher } from "@remix-run/react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ResultCode } from "~/utils/result"
import { ChangePasswordValidator } from "~/utils/validators"
import { FormError, InputError } from "../ui/Errors"
import { useTranslation } from "react-i18next"


export default ({ hasPassword }: { hasPassword: boolean }) => {
  const [success, setSuccess] = useState("")
  const fetcher = useFetcher()
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ChangePasswordValidator),
    mode: "onChange"
  })

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && fetcher.data?.code === ResultCode.OK) {
      setSuccess("Password saved")
    }
  }, [fetcher])

  return (
    <form
      className="flex flex-col gap-1 text-xs md:text-sm"
      onSubmit={handleSubmit(data => {
        fetcher.submit(
          { ...data, _action: "changePassword" },
          { method: "post" })
      })}>
      {
        hasPassword &&
        <div className="form-control">
          <label className="label w-10/12">
            <span className="label-text text-base">{t("userCenter.oldPassword")}</span>
            <InputError hidden={!errors.oldPassword} error={errors.oldPassword?.message as string} />
          </label>
          <input type="password"
            {...register("oldPassword")}
            className={`input input-sm input-bordered w-10/12 ${errors.oldPassword?.message ? "input-error" : ""}`} />
        </div>
      }
      <div className="form-control">
        <label className="label w-10/12">
          <span className="label-text text-base">{t("userCenter.newPassword")}</span>
          <InputError hidden={!errors.newPassword} error={errors.newPassword?.message as string} />
        </label>
        <input type="password"
          {...register("newPassword")}
          className={`input input-sm input-bordered w-10/12 ${errors.newPassword?.message ? "input-error" : ""}`} />
      </div>
      <div className="form-control">
        <label className="label w-10/12">
          <span className="label-text text-base">{t("userCenter.repeatPassword")}</span>
          <InputError hidden={!errors.repeatPassword} error={errors.repeatPassword?.message as string} />
        </label>
        <input type="password"
          {...register("repeatPassword")}
          className={`input input-sm input-bordered w-10/12 ${errors.repeatPassword?.message ? "input-error" : ""}`} />
      </div>

      <div className="form-control">
        {
          fetcher.state === "idle" && fetcher.data?.code && fetcher.data?.code !== ResultCode.OK &&
          <FormError code={fetcher.data?.code as number} /> || <></>
        }
      </div>

      <div className="form-control">
        {
          success && <p className="text-success text-sm">{success}</p>
        }
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary mt-4">{t("save")}</button>
      </div>
    </form>
  )
}