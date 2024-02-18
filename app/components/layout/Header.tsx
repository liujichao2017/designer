import { LanguageSwitcher, ThemeSwitcher } from "../ui/Switcher"
import { AvatarUserMenu } from "../ui/Avatar"
import Logo from "~/images/logo-sm.png"
import DefinerLogo from "~/components/ui/Logo"
import DesignLogo from "~/images/designpro-logo.png"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "@remix-run/react"
import { useNotifyIndicator } from "~/utils/store"
import { useState } from "react"
import Indicator from "../ui/notify/Indicator"
import NotifyList from "../ui/notify/NotifyList"
import { useUnreadNotifies } from "~/utils/hooks"
import { range } from "~/utils/helpers";
import { SimpleStep } from "~/components/ui/Step";
import { useTranslation } from "react-i18next";

export const DashboardHeader = ({ needLogo = false, className = "" }: { needLogo?: boolean, className?: string }) => {
  const [has, setIndicator] = useNotifyIndicator(s => [s.indicator, s.setIndicator])
  const unreadCount = useUnreadNotifies()
  return (
    <div
      className={`flex justify-between items-center sticky top-0 backdrop-blur-sm bg-base-100/0 mb-2 z-10 ${className}`}>
      {
        needLogo &&
        <Link to="/dashboard/project"><img src={Logo} alt="Logo" title="Definer tech"
          className="h-8" /></Link> ||
        <span></span>
      }
      <div className="flex gap-2 items-center">
        {/* <ColorSwitcher /> */}
        {/* <ThemeSwitcher /> */}
        <LanguageSwitcher />
        <Indicator unreadCount={unreadCount}>
          <NotifyList />
        </Indicator>
        <AvatarUserMenu size="sm" />
      </div>
    </div>
  )
}

export const OperatorHeader = (
  { title, children }: { title: string | React.ReactNode, children: React.ReactNode }
) =>
  <div className="h-10 flex justify-between items-center">
    <h3 className="font-medium text-lg">{title}</h3>
    {children}
  </div>

export const DemandHeader = ({ platform = 1 }: { platform: number }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isConsumer = searchParams.has("params")
  const { step } = useParams()
  const [currentStep, setCurrentStep] = useState(step)
  // if (pathname == '/demand/result' && currentStep != '5') {
  //     setCurrentStep('5')
  // }
  if (pathname == '/demand/confirm' && currentStep != '4') {
    setCurrentStep('4')
  }
  if (pathname == '/demand/designer' && currentStep != '3') {
    setCurrentStep('3')
  }
  if (pathname == '/demand/style' && currentStep != '2') {
    setCurrentStep('2')
  }
  if (pathname == '/demand/requirement' && currentStep != '1') {
    setCurrentStep('1')
  }
  const { t } = useTranslation()

  return (
    <div className="flex justify-between items-center bg-base-100/30 p-5 w-full shadow-sm lg:px-20 px-2">
      <div className="">
        {
          isConsumer &&
          <a href="https://user.definertech.com">
            {
              platform === 2 &&
              <img src={DesignLogo} alt="Logo" title="Definer tech" className="h-12" /> ||
              <DefinerLogo />
            }
          </a> ||
          <Link to="/dashboard/project">
            {
              platform === 2 &&
              <img src={DesignLogo} alt="Logo" title="Definer tech" className="h-12" /> ||
              <DefinerLogo />
            }
          </Link>
        }
      </div>
      <div className="flex-1 mx-10 hidden lg:block">
        <SimpleStep active={currentStep ? parseInt(currentStep) - 1 : -1}
          steps={range(4).map((_, i) => t(`demand.totalStep.${i}`))} />
      </div>
      <div>
        <LanguageSwitcher />
      </div>
    </div>
  )
}

export const ShareHeader = () => {
  return (
    <div
      className="flex justify-between items-center sticky top-0 backdrop-blur-sm bg-base-100/30 mb-2 z-10 py-5 w-full shadow-sm">
      <Link to="/dashboard/project">
        <img src={Logo} alt="Logo" title="Definer tech" className="h-9 ml-3" />
      </Link>
      <LanguageSwitcher />
    </div>
  )
}