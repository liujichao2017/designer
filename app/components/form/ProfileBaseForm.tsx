import { ChangeEvent, useCallback, useEffect, useRef } from "react"
import { EditorIcon } from "../ui/Icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProfileBaseValidator } from "~/utils/validators"
import CountrySelect from "./CountrySelect"
import { t } from "i18next";

type Props = {
  name: string,
  description: string,
  email: string,
  phone?: string,
  gender?: number,
  country?: string,
  editable?: boolean,
  onChange: (state: unknown) => void
}

export default function ({ name, description, editable = true, onChange = () => { }, ...props }: Props) {
  useEffect(() => {
    resize()
    onChange({ name, description, ...props })
  }, [])
  const resize = useCallback(() => {
    const target = document.getElementById("description")
    if (!target) return
    target.style.height = ""
    target.style.height = target.scrollHeight + "px"
  }, [])

  const { register, formState: { errors } } =
    useForm({ resolver: zodResolver(ProfileBaseValidator), mode: "onChange" })

  return (
    <form className="flex flex-col gap-4">
      <div className="flex gap-2 items-center justify-between group">
        <input
          {...register("name")}
          className={`input input-sm text-base font-semibold w-full text-center md:text-start ${errors.name && "textarea-error"}`}
          defaultValue={name} disabled={!editable} onBlur={(e) => onChange({ name: e.target.value })} />
        {
          editable &&
          <span className="opacity-0 group-hover:opacity-100 ease-in-out duration-300 hidden md:block">
            <EditorIcon size={4} />
          </span>
        }
      </div>
      <div className="flex gap-2 items-center justify-between group">
        <textarea
          id="description"
          {...register("description")}
          className={`textarea textarea-sm resize-none w-full ${errors.description && "textarea-error"}`}
          defaultValue={description} disabled={!editable}
          //@ts-ignore
          onBlur={(e) => onChange({ description: e.target.value })} />
        {
          errors.description && <span>{errors.description?.message as string}</span>
        }
        {
          editable &&
          <span className="opacity-0 group-hover:opacity-100 ease-in-out duration-300 hidden md:block">
            <EditorIcon size={4} />
          </span>
        }
      </div>

      {
        editable &&
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-4">
            <div className="w-full md:w-1/2">
              <input type="email" className="input input-sm w-full" placeholder="Email" defaultValue={props.email} disabled={true} />
            </div>

            <div className="w-full md:w-1/2 flex gap-4">
              <div className="flex items-center gap-1">
                <label htmlFor="male">Male</label>
                <input
                  {...register("gender")}
                  onChange={e => onChange({ gender: +e.target.value })}
                  type="radio" name="gender" className={`radio ${errors.gender && "radio-error"}`} id="male" value={0} defaultChecked={props.gender === 0} />
              </div>
              <div className="flex items-center gap-1">
                <label htmlFor="female">Female</label>
                <input
                  {...register("gender")}
                  onChange={e => onChange({ gender: +e.target.value })}
                  type="radio" name="gender" className={`radio ${errors.gender && "radio-error"}`} id="female" value={1} defaultChecked={props.gender === 1} />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end gap-4">
            <div className="w-full md:w-1/2">
              <input
                {...register("phone")}
                onBlur={(e) => onChange({ phone: e.target.value })}
                type="text" className={`input input-sm w-full ${errors.phone && "input-error"}`} placeholder="Phone" defaultValue={props.phone} />
            </div>

            <div className="w-full md:w-1/2">
              <CountrySelect
                {...register("country")}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange({ country: e.target.value })}
                defaultValue={props.country || "Country"}
                className={`select select-sm ${errors.country && "select-error"} `} />
            </div>
          </div>

        </div>
      }
    </form>
  )
}

