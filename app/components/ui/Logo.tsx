import { useTranslation } from "react-i18next"
import image from "~/images/logo@2x.png"
import google from "~/images/google-logo.png"
import design from "~/images/design-logo.png"
import seal from "~/images/seal.png"
import partner1 from "~/images/partner-1.png"
import partner2 from "~/images/partner-2.png"

export default () => {
  const { t } = useTranslation()
  return (
    <img src={image} title={t("greeting")} style={{ width: "136px", height: "65px" }} />
  )
}

export const MediumLogo = () => {
  const { t } = useTranslation()
  return (
    <img src={image} title={t("greeting")} style={{ width: "136px", height: "65px" }} />
  )
}

export const LargeLogo = () => {
  const { t } = useTranslation()
  return <img src={image} title={t("greeting")} />
}

export const GoogleLogo = () =>
  <img src={google} width={26} height={26} />

export const DesignLogo = () =>
  <img src={design} style={{ width: "183px", height: "62px" }} />

export const Seal = () =>
  <img src={seal} style={{ width: "100px", height: "100px" }} />

export const Partner1 = () => <img src={partner1} />
export const Partner2 = () => <img src={partner2} />