import { useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useGlobalLoadingState, useGlobalSubmittingState } from "remix-utils";

export const GlobalLoading = () => {
  const state = useGlobalSubmittingState()
  const style = state === "idle" ? "hidden" : "block"

  return (
    <div role="progressbar"
      className={`absolute top-0 left-0 w-full h-full bg-base-200/10 z-[9999999] backdrop-blur-sm flex justify-center items-center ${style}`}
    >
      <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )
}

export const GlobalLoadingBar = () => {
  const { state } = useNavigation()
  const opacity = state === "idle" ? "scale-x-0" : "scale-x-100"
  return (
    <div
      className={`fixed top-0 w-screen h-[2px] bg-gradient-to-r from-success via-warning to-error ${opacity} transition ease-in-out duration-1000 z-[9999999]`}>
    </div>
  )
}

const loadingFactory = (stateFunc: () => string) => () => {
  const { t } = useTranslation()
  const submission = stateFunc()
  const style = submission === "idle" ? "opacity-0 hidden" : "opacity-100 flex"
  return (
    <div className={`${style} bg-primary fixed z-[9999] left-0 top-0 items-center px-1 text-[0.6rem]`}>
      <span className="text-sm text-primary-content">{t(`submission.${submission}`)}</span>
      <Loading />
    </div>
  )
}

export const Loading = () =>
  <span className="loading loading-dots loading-xs text-base-100"></span>

export const SubmissionLoading = loadingFactory(useGlobalSubmittingState)
export const LoaderLoading = loadingFactory(useGlobalLoadingState)