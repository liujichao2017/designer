//@ts-nocheck
import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ExperienceValidator } from "~/utils/validators"
import { InputError } from "../ui/Errors"
import Datepicker from "react-tailwindcss-datepicker";
import { useAppearanceStore } from "~/utils/store"
import { useFetcher } from "@remix-run/react"
import { ResultCode } from "~/utils/result"
import CountrySelect from "./CountrySelect"
import { t } from "i18next";

type Props = {
  cancel: () => void
}

export default function ExperienceForm ({ cancel }: Props) {
  const lang = useAppearanceStore(state => state.lang)
  const mutation = useFetcher()
  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(ExperienceValidator), mode: "onChange" })

  const [workingDate, setWorkingDate] = useState({
    startDate: new Date(),
    endDate: new Date()
  })
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (mutation.state === "idle" && mutation.data?.code === ResultCode.OK) {
      cancel()
    }
  }, [mutation])

  return (
    <form method="dialog" className="flex flex-col gap-4 mb-28" onSubmit={handleSubmit(data => {
      mutation.submit(
        { ...data, active, start_at: workingDate.startDate, end_at: workingDate.endDate, _action: "addExperience" },
        { method: "post", encType: "application/json" }
      )
    })}>
      <div className="flex flex-col gap-1">
        <label htmlFor="company" className="flex gap-2 items-center">
          <span>{t('experiences.company')}</span>
          <InputError hidden={!errors.company} error={errors.company?.message as string} />
        </label>
        <input {...register("company")} type="text" className={`w-full input input-bordered input-sm ${errors.company && "input-error"}`} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="flex gap-2 items-center">
          <span>{t('experiences.title')}</span>
          <InputError hidden={!errors.title} error={errors.title?.message as string} />
        </label>
        <input {...register("title")} type="text" className={`w-full input input-bordered input-sm ${errors.title && "input-error"}`} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="flex gap-2 items-center">
          <span>{t('experiences.description')}</span>
          <InputError hidden={!errors.description} error={errors.description?.message as string} />
        </label>
        <textarea {...register("description")} id="description"
          className={`w-full textarea textarea-bordered textarea-sm resize-none ${errors.description && "textarea-error"}`} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="country" className="flex gap-2 items-center">
          <span>{t('experiences.location')}</span>
          <InputError hidden={!errors.country} error={`Country ${errors.country?.message as string}`} />
          <InputError hidden={!errors.city} error={`City ${errors.city?.message as string}`} />
        </label>
        <div className="flex gap-4">
          {/* <input {...register("country")} className={`w-full input input-bordered input-sm ${errors.country && "input-error"}`} /> */}
          <CountrySelect {...register("country")} defaultValue="Country" className={`w-full input input-bordered input-sm ${errors.country && "input-error"}`} />
          <input {...register("city")} type="text" placeholder="City" className={`w-full input input-bordered input-sm ${errors.city && "input-error"}`} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="working" className="flex gap-2 items-center">
          <span>{t('experiences.time')}</span>
        </label>
        <div className="flex flex-col gap-4">
          <Datepicker
            i18n={lang === "zh" ? "zh" : lang === "en" ? "en" : "zh-TW"}
            inputClassName="w-full input input-bordered input-sm"
            value={workingDate}
            onChange={(date) => {
              setWorkingDate({
                startDate: new Date(date?.startDate),
                endDate: new Date(date?.endDate)
              })
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="active" className="flex gap-2 items-center">
          <span>Active</span>
        </label>
        <div className="flex flex-col gap-4">
          <input type="checkbox" className="toggle toggle-primary" defaultChecked={active} onChange={e => setActive(e.target.checked)} />
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <a className="btn btn-sm" onClick={cancel}>Cancel</a>
        <button type="submit" className="btn btn-sm btn-primary">Save</button>
      </div>
    </form>
  )
}