import { useRef, useState, useEffect } from "react"
import { Outlet } from "@remix-run/react"
import { useTranslation } from "react-i18next"
import { SubmissionLoading } from "~/components/ui/Loading"

import Greeting from "~/images/greeting.jpg"
import { LanguageSwitcher } from "~/components/ui/Switcher"

export default () => {
  const { t } = useTranslation()
  const designerGreeting = useRef(t("auth.greetings.1"))
  const consumerGreeting = useRef(t("auth.greetings.0"))

  const [role, setRole] = useState(0)

  useEffect(() => {
  }, [role])
  return (
    <main className="min-h-screen flex">
      <SubmissionLoading />
      <div className="lg:flex flex-col items-center justify-center bg-[#f0f6fe] lg:w-1/2 hidden">
        <img src={Greeting} className="w-[22rem]" />
        <div className="text-lg font-thin flex flex-col items-center" dangerouslySetInnerHTML={{
          __html: t("auth.greetings.0").split("<br/>").map(v => `<p className="flex justify-center">${v}</p>`).join("")
        }}>
        </div>
        {/* <div className="text-lg font-thin flex flex-col items-center" dangerouslySetInnerHTML={{
            __html: designerGreeting.current.split("<br/>").map(v => `<p className="flex justify-center">${v}</p>`).join("")
          }}>
          </div> */}
      </div>
      <div className="flex items-center justify-center bg-white lg:w-1/2 w-full">


        <div className="fixed top-8 right-8">
          <LanguageSwitcher />
        </div>
        <Outlet context={setRole} />
      </div>
    </main>
  )
}