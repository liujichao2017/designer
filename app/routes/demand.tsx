import crypto from "node:crypto"
import { LoaderArgs, redirect } from "@remix-run/node";
import { Outlet, useSearchParams } from "@remix-run/react";
import { DemandHeader } from "~/components/layout/Header";
import { useService } from "~/services/services.server";
import { useDemandState } from "~/utils/store";
import { useEffect } from "react";

export async function loader ({ request }: LoaderArgs) {
  const url = new URL(request.url)
  const { searchParams } = url
  const sid = searchParams.get("sid")
  if (!sid) throw new Error("Invalid params")

  const demand = await useService("demand").getDemandByHash(crypto.createHash("md5").update(sid).digest("hex"))
  if (url.pathname !== "/demand/result" && demand) {
    return redirect("/demand/result?" + searchParams.toString())
  }

  return {}
}

export default function () {
  const [searchParams] = useSearchParams()
  const setPlatform = useDemandState(state => state.setPlatform)
  const platform = searchParams.get("platform") ? Number(searchParams.get("platform")) : 1
  useEffect(() => {
    setPlatform(Number(platform) as (1 | 2))
  }, [])
  return (
    <main className="bg-base-200/20">
      <section className="h-screen flex flex-col w-screen items-center overflow-y-scroll overflow-x-hidden">
        <DemandHeader platform={platform} />
        <Outlet />
      </section>
    </main>
  )
}