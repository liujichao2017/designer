import { LoaderArgs, json, redirect } from "@remix-run/node"
import { useLoaderData, useSearchParams } from "@remix-run/react"
import { useEffect } from "react"
import ContactForm from "~/components/form/demand/ContactForm"
import Footer from "~/components/layout/Footer"
import { DemandHeader } from "~/components/layout/Header"
import { encrypto } from "~/utils/crypto.server"
import { ResultCode } from "~/utils/result"
import { isAuthenticated } from "~/utils/sessions.server"
import { useDemandState } from "~/utils/store"

export async function loader (args: LoaderArgs) {
  let user = await isAuthenticated(args)
  if (!user) user = { id: 88 }
  const sid = encrypto({ ts: Date.now(), id: user.id })
  return json({ code: ResultCode.OK, sid })
}

export default function Page () {
  const { sid } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const setPlatform = useDemandState(state => state.setPlatform)
  const platform = searchParams.get("platform") ? Number(searchParams.get("platform")) : 1
  useEffect(() => {
    setPlatform(Number(platform) as (1 | 2))
  }, [])
  return (
    <main className="bg-base-200/20">
      <section className="h-screen flex flex-col w-full items-center overflow-y-scroll overflow-x-hidden">
        <DemandHeader platform={platform} />
        <div className="w-screen overflow-x-hidden mb-28 lg:mb-10">
          <ContactForm sid={sid} />
        </div>
        <div className="lg:fixed lg:bottom-0 w-screen px-4 bg-base-100">
          <Footer />
        </div>
      </section>
    </main>
  )
}