import { useRef, useState } from "react"
import Label from "./Label"
import { Popover, PopoverContent, PopoverTrigger } from "./Popover"
import { PlusIcon } from "./Icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { NameValidator } from "~/utils/validators"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"

type SkillProps = {
  id: number
  name: string
  description?: string
  remark?: string
}

type Props = {
  skills: SkillProps[]
  editable?: boolean
  remove?: (id: number) => void
  add?: (name: string) => void
  defaultSkillItems?: string[]
}

export default function SkillList ({ skills, remove, add, editable = true, defaultSkillItems = [] }: Props) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors }, reset } =
    useForm({ resolver: zodResolver(NameValidator), mode: "onSubmit" })
  return (
    <div className="flex flex-col gap-4">
      <div className="text-base font-semibold">
        {t("apply.skills")}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <AnimatePresence>
          {
            editable &&
            skills.map(skill => <SkillItem key={skill.id} skill={skill} close={() => remove && remove(skill.id)} />) ||
            skills.map(skill => <SkillItem key={skill.id} skill={skill} />)
          }
        </AnimatePresence>
      </div>

      {
        editable &&
        <div className="flex flex-col items-center gap-2">
          <button
            className="btn btn-sm btn-wide"
            onClick={() => {
              setOpen(prev => {
                if (!prev)
                  setTimeout(() => document.getElementById("newSkill")?.focus(), 200)
                return !prev
              })
            }}>
            <PlusIcon size={4} />
            {t("apply.addSkills")}
          </button>
          {
            open &&
            <form onSubmit={handleSubmit(data => {
              add && add(data.name)
              setOpen(false)
              reset()
            })}>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger>
                  <input {...register("name")} id="newSkill"
                    className={`input input-sm input-bordered w-[16rem] ${errors.name && "input-error" || ""}`} placeholder={t("apply.skills")} />
                </PopoverTrigger>
                <PopoverContent className="bg-base-100">
                  <ul className="w-[16rem] flex flex-col gap-2">
                    {
                      defaultSkillItems.map(val =>
                        <li key={val}
                          className="cursor-pointer hover:bg-base-200 p-1 rounded-md"
                          onClick={() => {
                            add && add(val);
                            setOpen(false)
                            reset()
                          }}>{val}</li>
                      )
                    }
                  </ul>
                </PopoverContent>
              </Popover>


            </form>
          }
        </div>
      }



    </div >
  )
}

export function SkillList2 ({ skills, remove, add, editable = true, defaultSkillItems = [] }: Props) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors }, reset } =
    useForm({ resolver: zodResolver(NameValidator), mode: "onSubmit" })
  return (
    <div className="flex flex-col gap-4">
      {/* <div className="text-base font-semibold">
        {t("apply.skills")}
      </div> */}
      <div className="flex gap-2 flex-wrap items-center pt-4">
        <AnimatePresence>
          {
            editable &&
            skills.map(skill => <SkillItem key={skill.id} skill={skill} close={() => remove && remove(skill.id)} />) ||
            skills.map(skill => <SkillItem key={skill.id} skill={skill} />)
          }
        </AnimatePresence>
      </div>

      {
        editable &&
        <div className="flex flex-col items-center gap-2">
          <button
            className="btn btn-sm btn-wide"
            onClick={() => {
              setOpen(prev => {
                if (!prev)
                  setTimeout(() => document.getElementById("newSkill")?.focus(), 200)
                return !prev
              })
            }}>
            <PlusIcon size={4} />
            {t("apply.addSkills")}
          </button>
          {
            open &&
            <form onSubmit={handleSubmit(data => {
              add && add(data.name)
              setOpen(false)
              reset()
            })}>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger>
                  <input {...register("name")} id="newSkill"
                    className={`input input-sm input-bordered w-[16rem] ${errors.name && "input-error" || ""}`} placeholder={t("apply.skills")} />
                </PopoverTrigger>
                <PopoverContent className="bg-base-100">
                  <ul className="w-[16rem] flex flex-col gap-2">
                    {
                      defaultSkillItems.map(val =>
                        <li key={val}
                          className="cursor-pointer hover:bg-base-200 p-1 rounded-md"
                          onClick={() => {
                            add && add(val);
                            setOpen(false)
                            reset()
                          }}>{val}</li>
                      )
                    }
                  </ul>
                </PopoverContent>
              </Popover>


            </form>
          }
        </div>
      }



    </div >
  )
}
export function SkillItem ({ skill, close }: { skill: SkillProps, close?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: 30 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 30 }}
    >
      <Label close={close}>
        {skill.name}
      </Label>
    </motion.div>
  )
}
export function SkillItem2 ({ skill, close }: { skill: SkillProps, close?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: 30 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 30 }}
    >
      <Label close={close}>
        {skill.name}
      </Label>
    </motion.div>
  )
}