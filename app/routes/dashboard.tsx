import { useRef } from "react"
import { Outlet, useLoaderData } from "@remix-run/react"
import { useEffect } from "react"
import { DashboardHeader } from "~/components/layout/Header"
import DashboardNav from "~/components/layout/DashboardNav"
import { loadUser } from "~/utils/loaders.server"
import { useUserState } from "~/utils/store"
import { useTranslation } from "react-i18next"

export const loader = loadUser

export default () => {
  const { t } = useTranslation()
  const { user, roles, endPoint, chatEndPoint } = useLoaderData<typeof loader>()
  const setUser = useUserState(state => state.setUser)

  useEffect(() => {
    setUser(user)
  }, [])

  const ref = useRef<HTMLDivElement>(null)
  const reachBottomCallback = useRef(() => {
  })

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = ref.current!
    const reachBottom = scrollTop + clientHeight >= scrollHeight - 200
    if (reachBottom) {
      reachBottomCallback.current()
    }
  }

  return (
    <main className="min-h-full flex">
      <nav className="flex flex-col justify-between w-[2rem] md:w-[18rem] h-screen">
        <DashboardNav roles={roles ?? []} endPoint={endPoint} chatEndPoint={chatEndPoint} />
      </nav>

      <section
        className="flex flex-col px-2 md:px-6 w-[calc(100vw-2rem)] md:w-[100vw-18rem] h-screen overflow-y-scroll bg-base-200/60"
        ref={ref} onScroll={handleScroll}>
        <DashboardHeader className="py-2" />
        <Outlet context={{ reachBottomCallback }} />
      </section>
    </main>
  )
}