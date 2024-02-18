import crypto from "node:crypto"
import { LoaderArgs, json } from "@remix-run/node"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useService } from "~/services/services.server"
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react"
import { encrypto } from "~/utils/crypto.server";
import { useDemandState } from "~/utils/store"

export async function loader ({ request }: LoaderArgs) {
  const { searchParams, } = new URL(request.url)
  const fromDesigner = searchParams.get('fromDesigner') ?? ''
  const hash = crypto.createHash("md5").update(searchParams.get("sid") ?? "").digest("hex")
  const demand = await useService("demand").getDemandByHash(hash)

  if (fromDesigner != 'y') {
    const loginUrl = `${process.env.CONSUMER_END_POINT}/api/auth?token=${encrypto({
      email: demand?.email,
      exp: new Date().toISOString()
    })}`;
    return json({ demand, loginUrl })
  }
  else {
    return json({ demand, loginUrl: '' })
  }

}

export default function () {
  const { demand, loginUrl } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [searchParams, _] = useSearchParams()
  const { t } = useTranslation()

  const reset = useDemandState(s => s.reset)
  useEffect(() => {
    reset()
  }, [])
  if (!demand) {
    navigate("/demand/requirement?" + searchParams.toString())
    return
  }

  const download = (pdfUrl: string) => {
    fetch(pdfUrl).then(resp => resp.arrayBuffer()).then(resp => {
      const file = new Blob([resp], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = "FileName" + new Date() + ".pdf";
      link.click();
    });
  }
  return (<div className="w-full justify-center flex mt-20 flex-col items-center">
    <div className="text-4xl">🎉</div>
    <div>{t("requirementSlogin.13")}</div>
    {/* <div>{t("requirementSlogin.14")}</div> */}
    {
      !!demand.quotation &&
      <div>{t("demand.quoted")}</div> ||
      <div>
        {loginUrl != '' ? t("requirementSlogin.14") : t("requirementSlogin.15")}
      </div>
    }
    {
      !!loginUrl &&
      <a href={loginUrl} className="rounded-lg bg-[#2F4CDD] text-white text-sm leading-10 h-10 w-20 text-center block mt-5 cursor-pointer">{t("demand.gotoOrder")}</a>
    }

  </div>
  )
}