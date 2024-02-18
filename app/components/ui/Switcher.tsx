import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { langs, useAppearanceState, useAppearanceStore, validLangs, validThemes } from "~/utils/store"
import { MoonIcon, SunIcon } from "./Icons"

export const ThemeSwitcher = () => {
  const changeTheme = useAppearanceState(state => state.changeTheme)
  const current = useAppearanceStore(state => state.theme)
  const { t } = useTranslation()
  return (
    <div className="dropdown dropdown-end hidden md:block">
      <label tabIndex={0} className="cursor-pointer">
        {
          current === "light" ?
            <button className="flex w-11 h-11 hover:shadow-lg hover:bg-base-200 justify-center items-center rounded-full cursor-pointer duration-150 ease-in-out">
              <SunIcon />
            </button> :
            <button className="flex w-11 h-11 hover:shadow-lg hover:bg-base-200 justify-center items-center rounded-full cursor-pointer duration-150 ease-in-out">
              <MoonIcon />
            </button>
        }
      </label>
      <div tabIndex={0} className="dropdown-content z-[999] menu shadow bg-base-100 rounded-sm w-40">
        <div className="flex flex-col overflow-y-auto items-center gap-1 h-[4.5rem]">
          <button className="btn btn-sm btn-ghost px-6" onClick={() => changeTheme("light")}>
            <SunIcon />
            <span>{t("themes.light")}</span>
          </button>
          <button className="btn btn-sm btn-ghost px-6" onClick={() => changeTheme("dark")}>
            <MoonIcon />
            <span>{t("themes.dark")}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export const ColorToggler = () => {
  const changeTheme = useAppearanceState(state => state.changeTheme)
  return (
    <div className="form-control">
      <label className="label cursor-pointer gap-1">

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>

        <input type="checkbox" className="toggle toggle-sm" defaultChecked={false} onChange={event => {
          changeTheme(event.target.checked ? "light" : "dark")
        }} />

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>

      </label>
    </div>
  )
}

export const ColorSwitcher = () => {
  const changeTheme = useAppearanceState(state => state.changeTheme)
  const theme = useAppearanceStore(state => state.theme)
  return (
    <label className="swap swap-rotate m-r-4 btn btn-sm btn-ghost">

      <input type="checkbox" defaultChecked={theme === "dark"} onChange={event => {
        changeTheme(event.target.checked ? "dark" : "light")
      }} />

      {/* sun icon */}
      < svg className="swap-on fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" > <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" /></svg>

      {/* moon icon */}
      <svg className="swap-off fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" /></svg>

    </label >
  )
}

export const LanguageSwitcher = () => {
  // const lang = useAppearanceStore(state => state.lang)
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
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="cursor-point">
        <button className="flex w-11 h-11 hover:shadow-lg hover:bg-base-200 justify-center items-center rounded-full cursor-pointer duration-150 ease-in-out">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
          </svg>
        </button>
      </label>
      <ul tabIndex={0} className="dropdown-content z-[1] menu px-2 shadow bg-base-100 rounded-sm w-36 gap-1">
        {
          Object.entries(validLangs).map(([lang, name]) => (
            <li key={lang}>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  switchLang(lang as langs)
                }}
              >{name}
              </button>
            </li>
          ))
        }
      </ul>
    </div>
  )
}