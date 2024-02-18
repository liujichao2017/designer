//@ts-nocheck
import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { encrypto } from "~/utils/crypto.server";
import { ResultCode, fault } from "~/utils/result";
import { cors } from "remix-utils";
import * as html2pdf from "html-pdf-node"
import { getCurrent } from "~/utils/sessions.server";
import { IdValidator } from "~/utils/validators";


export async function loader ({ request, context }: LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const _loader = searchParams.get("_loader")
  const user = await getCurrent({ request, context })
  switch (_loader) {
    case "sharelink":
      {
        let id = searchParams.get("id")
        if (!id && !user) return json({ code: ResultCode.FORM_INVALID })
        if (!id) id = user?.id
        const sid = encrypto({ ts: Date.now(), id })
        return cors(request, json({ sharelink: sid, link: `${process.env.END_POINT}/demand/requirement?sid=${sid}` }))
      }
    case "shareproject":
      {
        const result = IdValidator.safeParse(Object.fromEntries(searchParams))
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        const sid = encrypto({ id: result.data.id, expire: Date.now() + 1000 * 60 * 60 * 24 * 3 })
        return cors(request, json({
          sharelink: sid,
          link: `${process.env.END_POINT}/share/project/${sid}`
        }))
      }
  }
  return {}
}

export async function action ({ request }: ActionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE',
      },
    })
  }
}