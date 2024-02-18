//@ts-nocheck
import { Link } from "@remix-run/react"
import { UserProps, useCurrent } from "~/utils/store"
import "cropperjs/dist/cropper.css"
import { ImageCropper } from "./Cropper"
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip"
import { useTranslation } from "react-i18next"
import { useContext } from "react"
import { ChatContext } from "~/utils/socketio"

export type AvatarProps = {
  user?: UserProps & Profile
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

type Profile = {
  profile?: {
    phone?: string,
    description?: string,
    language?: number, country?: string, state?: string
  }
}

const avatarSize = {
  xs: "w-8",
  sm: "w-10",
  md: "w-14",
  lg: "w-20",
  xl: "w-28",
} as const

export const PlainAvatar = ({ user, size = "md" }: AvatarProps) => {
  user = user ?? useCurrent()
  return (
    <div className="avatar placeholder">
      <div className={`${avatarSize[size]} rounded-full bg-accent-focus`}>
        {
          user?.avatar &&
          <img src={user.avatar} /> ||
          <span className="uppercase text-[1rem] font-semibold" title={user?.name}>{user?.name?.at(0) ?? user?.email?.at(0)}</span>
        }
      </div>
    </div>
  )
}

export const HoveredAvatar = ({ user, size = "md" }: AvatarProps) => {
  const chat = useContext(ChatContext)
  const { t } = useTranslation()
  return (
    <div className="dropdown dropdown-hover">
      <label tabIndex={0} className="m-1">
        <PlainAvatar user={user} size={size} />
      </label>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-4 shadow bg-base-100 rounded-md w-[22rem]">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div>
              <PlainAvatar user={user} size="md" />
            </div>

            <div className="flex flex-col text-sm gap-2">
              <span className="flex flex-wrap">{user?.name}</span>
              <span className="flex flex-wrap">{user?.email}</span>
              <span className="flex flex-wrap">Phone: {user?.profile?.phone ?? "--"}</span>
              <span className="flex flex-wrap">Language: {user?.profile?.language && t("userCenter.languageList." + user.profile.language || "--")}</span>
              <span className="flex flex-wrap">Desc: {user?.profile?.description ?? "--"}</span>
              <div className="flex">
                <span>{user?.profile?.country ?? ""}</span>
                <span>{user?.profile?.state ?? ""}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link to={"/portfolio/" + user?.id} className="btn btn-sm">Portfolio</Link>
            {/* <button className="btn btn-sm btn-primary" onClick={_ => {
              chat?.setOpen(true)
              chat?.invite(user.id)
            }}>Live chat</button> */}
          </div>
        </div>
      </ul>
    </div>
  )
}

export const AvatarUserMenu = ({ user, size = "xs" }: AvatarProps) => {
  const { t } = useTranslation()
  user = user ?? useCurrent()
  const width = avatarSize[size]
  return (
    <div className="dropdown dropdown-end">
      {
        user?.avatar &&
        <div tabIndex={0} className="avatar">
          <div className={`${width} rounded-full hover:shadow-lg cursor-pointer tooltip`} data-tip={user.name}>
            {
              <img src={user.avatar} />
            }
          </div>
        </div> ||
        <div tabIndex={0} className="avatar placeholder">
          <div className={`${width} rounded-full bg-accent-focus text-accent-content hover:shadow-lg cursor-pointer`}>
            <span className="uppercase text-lg font-semibold">{user?.name?.at(0) ?? user?.email?.at(0)}</span>
          </div>
        </div>
      }

      <div tabIndex={0} className="dropdown-content z-[898] menu p-2 shadow bg-base-100 rounded-sm px-6 py-4 flex flex-col gap-3 w-40">
        {/* <Link to={"/dashboard/profile"} className="flex gap-1 items-center hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          {t("nav.user")}
        </Link> */}
        <Link to={"/dashboard/profile/info"} className="flex gap-1 items-center hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          {t("nav.personal")}
        </Link>
        <Link to={"/dashboard/profile/secure"} className="flex gap-1 items-center hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          {t("nav.pwd")}
        </Link>
        <Link to={"/auth/logout"} className="flex gap-1 items-center hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          {t("logout")}
        </Link>
      </div>
    </div>
  )
}

export const EditableAvatar = (
  { user, upload, size = "lg" }: AvatarProps & { upload: (data: string) => void }
) => {
  const width = avatarSize[size] ?? avatarSize.md
  return (
    <>
      <dialog id="avatarDialog" className="modal">
        <form method="dialog" className="modal-box flex flex-col gap-5 w-screen max-w-5xl">
          <a className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => {
              (window as any)?.avatarDialog?.close()
            }}>
            ✕
          </a>

          <ImageCropper title="Change Avatar" raw={user?.avatar} maxDataSize={1024 * 500}
            cancel={() => {
              (window as any)?.avatarDialog?.close()
            }}
            upload={(data: string) => {
              (window as any)?.avatarDialog?.close()
              upload(data)
            }} />
        </form>
      </dialog>

      <div className="avatar flex group/avatar placeholder">

        <div className={`${width} rounded-full bg-accent-focus text-accent-content cursor-pointer group-hover/avatar:shadow-lg ease-in-out duration-150`} onClick={_ => {
          (window as any)?.avatarDialog?.showModal()
        }}>
          {
            user?.avatar &&
            <img src={user.avatar} title={user.name} /> ||
            <span className="uppercase text-[1rem] font-semibold" title={user?.name}>{user?.name?.at(0) ?? user?.email?.at(0)}</span>
          }
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 self-end opacity-0 group-hover/avatar:opacity-100 ease-in-out duration-150">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </div >
    </>
  )
}

export const Avatar = PlainAvatar
export default Avatar