import { LoaderArgs, redirect } from "@remix-run/node"
import { useNavigate, useParams, useSearchParams, useLoaderData } from "@remix-run/react"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import AttachForm from "~/components/form/demand/AttachForm"
import ContactForm from "~/components/form/demand/ContactForm"
import DesignForm from "~/components/form/demand/DesignForm"
import { ResultCode } from "~/utils/result"
import { decrypto , encrypto } from "~/utils/crypto.server";
import { isAuthenticated } from "~/utils/sessions.server"
import { useDemandState } from "~/utils/store"
import { DemandHeader } from "~/components/layout/Header"
import Footer from "~/components/layout/Footer"

export async function loader ({ request, params }: LoaderArgs) {
  const { cipher } = params
  const { designerId } = await decrypto(cipher as string) as { designerId: number, }
  // let user = await isAuthenticated(args)
  // if (!user) user = { id: 88 }
  const sid = encrypto({ ts: Date.now(), id: designerId })
  console.log("designerId", designerId)
  return { designerId, sid, code: ResultCode.OK }
}

export default function Page () {
  const { sid, designerId } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const setPlatform = useDemandState(state => state.setPlatform)
  const platform = searchParams.get("platform") ? Number(searchParams.get("platform")) : 1
  useEffect(() => {
    setPlatform(Number(platform) as (1 | 2))
  }, [])
  const { t } = useTranslation()

  return (
    <main className="bg-base-200/20">
      <section className="h-screen flex flex-col w-full items-center overflow-y-scroll overflow-x-hidden">
        <DemandHeader platform={platform} />
        <div className="w-screen overflow-x-hidden mb-28 lg:mb-10">
          <ContactForm sid={sid} designerId={designerId+''}/>
        </div>
        <div className="fixed bottom-0 w-screen px-4 bg-base-100">
          <Footer />
        </div>
      </section>
    </main>

    
  )
}
