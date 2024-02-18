import { produce } from "immer"
import { useEffect, useState } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import localForage from "localforage"
import { z } from "zod"
import { DemandValidator } from "./validators"

export enum Roles {
  SUPER_ADMIN = "superAdmin",
  PRO = "pro",
  BACK_ADMIN = "backAdmin",
  CONSUMER = "consumer",
  tag = "tag",
  editor = "editor"
}

/**
 * A custom hook that allows you to access and subscribe to a store, and retrieve the selected state.
 *
 * @param {function} store - A function that takes a selector function and returns the selected state from the store.
 * @param {function} selector - A function that takes the entire state and returns the selected state.
 * @return {T} The selected state from the store.
 */
export const useStore = <T, F> (
  store: (selector: (state: T) => unknown) => unknown,
  selector: (state: T) => F
) => {
  const result = store(selector) as F
  const [state, setState] = useState<F>()
  useEffect(() => setState(result), [result])
  return state
}

export const validThemes = [
  "light",
  "dark",
] as const

export const validLangs = { cht: "繁體中文", zh: "简体中文", en: "English" }
export type langs = keyof typeof validLangs

export type Appearance = {
  theme: typeof validThemes[number]
  lang: typeof validLangs[keyof typeof validLangs]
  changeTheme: (theme: Appearance['theme']) => void
  changeLang: (lang: Appearance['lang']) => void
}

export const useAppearanceState = create<Appearance>()(persist(
  set => ({
    theme: typeof window === "object" ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light") : "light",
    lang: "cht",
    changeTheme: theme => set(state => ({ ...state, theme })),
    changeLang: lang => set(state => ({ ...state, lang })),
  }),
  { name: '__appearance' }
))


export const useAppearanceStore = <R> (selector: (state: Appearance) => R) => useStore(useAppearanceState, selector)

export type UserProps = {
  id: number,
  name?: string,
  email?: string,
  avatar?: string,
  roles?: string[] | RawRole[]
}

export type RawRole = {
  role: {
    id: number
    name: string
  }
}

export const isRole = (user: UserProps, role: string) => {
  if (!user.roles?.length) return false
  if (typeof user.roles.at(0) === "object")
    return user.roles?.map(val => (val as RawRole).role?.name).includes(role)
  if (typeof user.roles.at(0) === "string")
    return (user.roles as string[]).includes(role)
}

type UserCurrent = {
  current?: UserProps
}

type UserAction = {
  setUser: (user: UserProps) => void
  logout: () => void
  setName: (name: string) => void
  setEmail: (email: string) => void
  setAvatar: (avatar: string) => void
  setRoles: (roles: string[]) => void
}

export const useUserState = create<UserAction & UserCurrent>()(persist(
  set => ({
    current: undefined,
    setUser: user => set(state => ({ ...state, current: user })),
    logout: () => set(state => ({ ...state, current: undefined })),
    setEmail: email => set(produce(state => { state.current.email = email })),
    setName: name => set(produce(state => { state.current.name = name })),
    setAvatar: avatar => set(produce(state => { state.current.avatar = avatar })),
    setRoles: roles => set(produce(state => { state.current.roles = roles })),
  }),
  { name: '__user' }
))

export const useCurrent = () => useStore(useUserState, state => state.current)
export const useCurrentRoles = () => useStore(useUserState, state => state.current?.roles)

export type Contact = {
  name: string
  email: string
  whatsapp: string
}

export type PrintOptions = {
  quality?: number
  pages?: number
  size?: number
  coverPaper?: number
  innerPaper?: number
  bindingType?: number //staple
  finishOptions?: number[]
}

export type DesignOptions = {
  type?: number

  category?: number
  size?: number
  pages?: number

  logoSummary?: string //loginDesign
  logo?: number

  foldingType?: number

  suite?: number

  final_delivery_time?: string

}

export type File = { src: string, type: string, name: string, size: number, id: string }

export type BussinessOptions = {
  lang?: number
  style?: number
  size?: number
  direct?: number
  suite?: number
  frontSide?: { desc?: string, attachments?: File[] }
  backSide?: { desc?: string, attachments?: File[] }
}

export type AttachmentOptions = {
  remark?: string
  link?: string
  date?: string
  images?: File[] | { litpic_url: string, img_url?: string, thumbnail?: string, image?: string, name?: string, size?: number }[]
}

export type SimplePicture = {
  id?: number
  image?: string
  thumbnail?: string
}

export interface Demand {
  id?: string | number
  platform?: 1 | 2
  contact?: Contact
  service?: number
  design?: DesignOptions
  print?: PrintOptions
  bussiness?: BussinessOptions
  attachment?: AttachmentOptions
  selectedImages?: SimplePicture[]
  designer?: UserProps
  setId: (id: string | number) => void
  setPlatform: (platform: 1 | 2) => void
  setDesigner: (user: UserProps) => void
  setBussiness: (bussiness: BussinessOptions) => void
  setContact: (contact: Contact) => void
  setService: (service: number) => void
  setDesignOption: (options?: DesignOptions) => void
  setPrintOption: (options?: PrintOptions) => void
  setAttachmentOption: (options?: AttachmentOptions) => void
  resetDesignOption: () => void
  resetPrintOption: () => void
  resetDesigner: () => void
  resetBussiness: () => void
  resetAttachmentOption: () => void
  setSelectImages: (images: SimplePicture[]) => void
  reset: () => void
}

export function fromData (
  demand: z.infer<typeof DemandValidator> &
  {
    id: number, quotation?: number, quotation_pdf?: string,
    selectedImages?: SimplePicture[], designer: UserProps
  }):
  Demand &
  {
    quotation?: { price: number, totalPrice: number, pages: number },
    quotation_pdf?: string,
    level?: number
  } {
  //@ts-ignore
  return {
    ...demand,
    platform: demand.platform as (1 | 2),
    service: demand.services,
    contact: {
      name: demand.name,
      email: demand.email,
      whatsapp: demand.contact_number
    },
    design: {
      type: demand.type,
      category: demand.category,
      size: demand.size,
      pages: demand.page,
      logoSummary: demand.logo_design,
      logo: demand.logo_type,
      foldingType: demand.folding,
      final_delivery_time: demand.final_delivery_time,
      suite: demand.suite
    },
    print: {
      quality: demand.printing_number,
      pages: demand.printing_page,
      size: demand.printing_size,
      coverPaper: demand.cover_paper,
      innerPaper: demand.inner_paper,
      bindingType: demand.folding,
      finishOptions: demand.finish && JSON.parse(demand.finish)
    },
    bussiness: JSON.parse(demand.bussiness_card ?? "{}"),
    attachment: {
      remark: demand.remark,
      link: demand.attach_link,
      date: demand.final_delivery_time,
      images: JSON.parse(demand.img_list ?? "[]")
    },
    quotation: {
      price: (demand.quotation ?? 0) / (demand.page ?? 1),
      totalPrice: demand.quotation ?? 0,
      pages: demand.page ?? 0
    },
  }
}

export const useDemandState = create<Demand>()(persist(
  (set) => ({
    selectedImages: [],
    setId: id => set(state => ({ ...state, id })),
    setPlatform: platform => set(state => ({ ...state, platform })),
    setDesigner: designer => set(state => ({ ...state, designer })),
    setBussiness: bussiness => set(state => ({ ...state, bussiness })),
    setContact: contact => set(state => ({ ...state, contact })),
    setService: service => set(state => ({ ...state, service })),
    setDesignOption: options => set(state => ({ ...state, design: { ...state.design, ...options } })),
    setPrintOption: options => set(state => ({ ...state, print: { ...state.print, ...options } })),
    setAttachmentOption: options => set(state => ({ ...state, attachment: { ...state.attachment, ...options } })),
    resetDesignOption: () => set(state => ({ ...state, design: undefined })),
    resetPrintOption: () => set(state => ({ ...state, print: undefined })),
    resetDesigner: () => set(state => ({ ...state, designer: undefined })),
    resetBussiness: () => set(state => ({ ...state, bussiness: undefined })),
    resetAttachmentOption: () => set(state => ({ ...state, attachment: undefined })),
    setSelectImages: images => set(state => ({ ...state, selectedImages: images })),

    reset: () => set(state => ({
      ...state,
      id: undefined,
      platform: 1,
      designer: undefined,
      bussiness: undefined,
      contact: undefined,
      service: undefined,
      design: undefined,
      print: undefined,
      attachment: undefined,
      selectedImages: []
    }))
  }),
  {
    name: '__demand',
    //@ts-ignore
    storage: createJSONStorage(() => localForage), // (optional) by default, 'localStorage' is used
  })
)

export type NotifyIndicator = {
  indicator: boolean
  setIndicator: (b: boolean) => void
}
export const useNotifyIndicator = create<NotifyIndicator>(
  set => ({
    indicator: false,
    setIndicator: b => set({ indicator: b })
  })
)