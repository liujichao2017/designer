import Backend from "i18next-fs-backend"
import { resolve } from "node:path"
import { RemixI18Next } from "remix-i18next"
import i18n from "~/i18n" // your i18n configuration file
import { language } from "./utils/cookie.server"

let i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
    cookie: language,
    order: ["cookie"]
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  plugins: [Backend],
})

export default i18next