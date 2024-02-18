import { ExperienceList2 } from "~/components/ui/ExperienceList"
import { redirect, ActionArgs, json } from "@remix-run/node"
import { useFetcher, useParams } from "@remix-run/react"
import { useState } from "react"
import { useOutletContext } from '@remix-run/react'
import ExperienceForm from "~/components/form/ExperienceForm"
import { ExperienceValidator, IdValidator } from "~/utils/validators"
import { isAuthenticated } from "~/utils/sessions.server"
import { useService } from "~/services/services.server"
import { ResultCode } from "~/utils/result"

export async function action (args: ActionArgs) {
    const user = await isAuthenticated(args)
    if (!user) throw redirect("/auth/signin")
    const data = await args.request.json()
    const service = useService("profile", { user })
    const { _action } = data
    switch (_action) {
    
      case "addExperience":
        {
          const result = await ExperienceValidator.safeParseAsync(data)
          if (!result.success) {
            console.log(result.error.format())
            return { code: ResultCode.FORM_INVALID }
          }
          return json(await service.addExperience(result.data.company, result.data.title, result.data.description, result.data.start_at, result.data.end_at, result.data.active, result.data.country, result.data.city))
        }
      case "removeExperience":
        {
          const result = IdValidator.safeParse(data)
          if (!result.success) {
            return { code: ResultCode.FORM_INVALID }
          }
          return json(await service.removeExperience(result.data.id))
        }
      case "removePortfolio":
        {
            const result = IdValidator.safeParse(data)
            if (!result.success) {
            return { code: ResultCode.FORM_INVALID }
            }
            return json(await service.removePortfolio(result.data.id))
        }
    }
}
  
export default function Page () {
    const { profile }:  any = useOutletContext();
    const [openExperience, setOpenExperience] = useState(false)
    const mutation = useFetcher()
    const { id } = useParams()
    return (
        <div className="bg-base-100 p-6">
            <ExperienceList2 experiences={profile?.experiences} editable={!id}
            add={() => { setOpenExperience(prev => !prev) }}
            remove={(id: number) => { mutation.submit({ _action: "removeExperience", id }, { method: "post", encType: "application/json" }) }} />
            {openExperience && <ExperienceForm cancel={() => { setOpenExperience(false) }} />}
        </div>
    )
}