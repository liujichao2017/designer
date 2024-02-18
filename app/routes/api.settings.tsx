import { ActionArgs, json } from "@remix-run/node"
import { language } from "~/utils/cookie.server"
import { ResultCode } from "~/utils/result"
import { validLangs } from "~/utils/store"

export async function action ({ request }: ActionArgs) {
  const form = await request.formData()
  const _action = form.get("_action")

  switch (_action) {
    case "changeLanguage":
    default:
      const lang = form.get("lang") as string
      if (Object.keys(validLangs).includes(lang))
        return json({ code: ResultCode.OK, locale: lang }, { headers: { "Set-Cookie": await language.serialize(lang) } })
  }
  return json({ code: ResultCode.FORM_INVALID })
}