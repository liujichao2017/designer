import { langs, useAppearanceState, useAppearanceStore, validLangs } from "~/utils/store";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { useTranslation } from "react-i18next";
import { memo, useCallback } from "react";
import { cn } from "~/lib/utils";

export default function Footer () {
  const lang = useAppearanceStore(state => state.lang) as keyof typeof validLangs
  const changeLang = useAppearanceState(state => state.changeLang)

  const { i18n } = useTranslation()
  const switchLang = useCallback((locale: langs) => {
    i18n.changeLanguage(locale)
    changeLang(locale)
    const body = new URLSearchParams();
    body.append("lang", locale)
    body.append("_action", "changeLanguage")

    fetch("/api/settings", { method: "post", body })
  }, [])


  return (
    <div className="flex border-t border-base-content/5 justify-center lg:items-center py-3 text-sm flex-col-reverse lg:flex-row gap-2 lg:gap-0">
      <span className="lg:px-4 lg:border-r border-base-content/5">@ HobbyLand Technology Limited </span>
      <a
        className="lg:px-4 lg:border-r border-base-content/5 hover:link-primary hover:link"
        href="https://definertech.com/terms-of-use/" target="_blank">
        Terms and Conditions
      </a>
      <a
        className="lg:px-4 lg:border-0 border-base-content/5 hover:link-primary hover:link"
        href="https://definertech.com/privacy-policy/" target="_blank">
        Privacy
      </a>



      {/* <Popover>
        <PopoverTrigger>
          <div className="flex lg:gap-2 items-center lg:px-4 hover:link-primary hover:link cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 hidden lg:inline-block">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="lg:w-20 flex justify-center">{validLangs[lang]}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Menu switchLang={switchLang} lang={lang} />
        </PopoverContent>
      </Popover> */}
    </div>
  )
}

const Menu = memo(function ({ switchLang, lang }: { lang: string, switchLang: (l: keyof typeof validLangs) => void }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      {
        Object.entries(validLangs).map(([l, name]) =>
          <div key={l}
            className={cn("rounded-md px-4 py-1 hover:bg-base-300/60 cursor-pointer", lang === l ? "bg-primary text-base-100 hover:bg-primary" : "")}
            onClick={_ => {
              switchLang(l as keyof typeof validLangs)
            }}
          >
            {name}
          </div>
        )
      }
    </div>
  )
})