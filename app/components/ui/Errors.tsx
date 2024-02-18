import { useTranslation } from "react-i18next"
import Lottie from "lottie-react"

import errorAnimation from "../../animations/error-2.json"

export const InputError = (
  { error = "", hidden = false, ...props }: { error?: string, hidden?: boolean }
) => {
  return (
    <span className={`text-error text-sm font-semibold ${hidden ? "opacity-0" : "opacity-100"}`} {...props}>{error}</span>
  )
}

export const FormError = ({ code }: { code: number }) => {
  const { t } = useTranslation()
  return (
    <span className="text-error text-sm font-semibold">{t(`errors.${code}`)}</span>
  )
}

export const PageError = () => {
  return (
    <div className="w-full h-full flex gap-3 justify-center items-center">
      <Lottie animationData={errorAnimation} />
    </div>
  )
}

export const NotFoundError = () => {
  return (
    <div className="w-full h-full flex gap-3 justify-center items-center">
      <h3>404 NOT FOUND</h3>
    </div>
  )
}

export const UnknownError = ({ reason }: { reason: string }) => {
  return (
    <div className="w-full h-full flex gap-3 justify-center items-center">
      <h3 className="text-error text-lg uppercase font-semibold">{reason}</h3>
    </div>
  )
}