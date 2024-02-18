import { Prisma } from "@prisma/client";
import { PlusIcon, RemoveIcon } from "./Icons";
import dayjs from "dayjs";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  experiences: (Prisma.experienceCreateInput & { id: number })[]
  editable?: boolean
  remove?: (id: number) => void
  add?: () => void
}

export default function ExperienceList ({ experiences, remove = () => { }, add = () => { }, editable = true }: Props) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="text-base font-semibold mb-4 flex justify-between items-center group">
        <span>{t("apply.experiences")}</span>
      </div>
      <div className="flex flex-col gap-4">
        {
          experiences?.map(val => <ExperienceItem key={val.id} experience={val} remove={remove} editable={editable} />)
        }
      </div>

      {
        editable &&
        <div className="flex justify-center mt-2">
          <button className="btn btn-sm btn-wide" onClick={add}>
            <PlusIcon size={4} />
            {t("apply.addExperience")}
          </button>
        </div>
      }
    </div>
  )
}

export function ExperienceItem (
  { experience, remove, editable = true }: { experience: Prisma.experienceCreateInput & { id: number }, remove: (id: number) => void, editable?: boolean }) {
  const [popOpen, setPopOpen] = useState(false)
  return (
    <div className="flex flex-col group">
      <div className="font-semibold text-sm flex justify-between items-center">
        <span>
          {experience.company} | {experience.title}
        </span>
        {
          editable &&

          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger onClick={() => setPopOpen(prev => !prev)}>
              <span className="cursor-pointer opacity-0 group-hover:opacity-100 ease-in-out duration-300">
                <RemoveIcon size={4} />
              </span>
            </PopoverTrigger>

            <PopoverContent className="bg-base-100 shadow-md rounded-md p-4 flex flex-col gap-2 text-sm">
              <h3>
                Are you sure you want to delete this record?
              </h3>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-xs" onClick={() => setPopOpen(false)}>Cancel</button>
                <button className="btn btn-xs btn-error" onClick={() => {
                  setPopOpen(false)
                  remove(experience.id)
                }}>Delete</button>
              </div>
            </PopoverContent>
          </Popover>
        }

      </div>
      <div className="flex gap-1 text-xs text-base-content/60">
        <span>
          {dayjs(experience.start_at).format("YYYY-MM-DD")} - {dayjs(experience.end_at).format("YYYY-MM-DD")}
        </span>
        <span className="divider divider-horizontal"></span>
        <span>
          {experience.country ?? ""} - {experience.city ?? ""}
        </span>
      </div>
      <div className="text-sm">
        {experience.description}
      </div>
    </div >
  )
}

export function ExperienceList2 ({ experiences, remove = () => { }, add = () => { }, editable = true }: Props) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="flex flex-col gap-4">
        {
          experiences?.map(val => <ExperienceItem key={val.id} experience={val} remove={remove} editable={editable} />)
        }
      </div>

      {
        editable &&
        <div className="flex justify-left mt-2">
          <button className="btn btn-sm btn-wide" onClick={add}>
            <PlusIcon size={4} />
            {t("apply.addExperience")}
          </button>
        </div>
      }
    </div>
  )
}

export function ExperienceItem2 (
  { experience, remove, editable = true }: { experience: Prisma.experienceCreateInput & { id: number }, remove: (id: number) => void, editable?: boolean }) {
  const [popOpen, setPopOpen] = useState(false)
  return (
    <div className="flex flex-col group">
      <div className="font-semibold text-sm flex justify-between items-center">
        <span>
          {experience.company} | {experience.title}
        </span>
        {
          editable &&

          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger onClick={() => setPopOpen(prev => !prev)}>
              <span className="cursor-pointer opacity-0 group-hover:opacity-100 ease-in-out duration-300">
                <RemoveIcon size={4} />
              </span>
            </PopoverTrigger>

            <PopoverContent className="bg-base-100 shadow-md rounded-md p-4 flex flex-col gap-2 text-sm">
              <h3>
                Are you sure you want to delete this record?
              </h3>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-xs" onClick={() => setPopOpen(false)}>Cancel</button>
                <button className="btn btn-xs btn-error" onClick={() => {
                  setPopOpen(false)
                  remove(experience.id)
                }}>Delete</button>
              </div>
            </PopoverContent>
          </Popover>
        }

      </div>
      <div className="flex gap-1 text-xs text-base-content/60">
        <span>
          {dayjs(experience.start_at).format("YYYY-MM-DD")} - {dayjs(experience.end_at).format("YYYY-MM-DD")}
        </span>
        <span className="divider divider-horizontal"></span>
        <span>
          {experience.country ?? ""} - {experience.city ?? ""}
        </span>
      </div>
      <div className="text-sm">
        {experience.description}
      </div>
    </div >
  )
}