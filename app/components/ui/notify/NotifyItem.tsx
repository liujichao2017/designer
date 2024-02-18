import { Link } from "@remix-run/react";
import Avatar from "../Avatar";
import { UserProps } from "~/utils/store";
import { useTranslation } from "react-i18next";
import { RemoveIcon, EyesIcon } from "../Icons"
import { useEffect, useRef, useState, useTransition } from "react";


export function ApplyNotication ({ id, sender, approve, reject, mark }:
  {
    id: number,
    sender: UserProps,
    approve?: (id: number) => void,
    reject?: (id: number, reason: string) => void,
    mark?: (id: number) => void
  }) {
  if (!sender?.id || !sender?.email) {
    return <>{id}</>
  }
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) {
      startTransition(() => {
        if (ref.current) ref.current.focus()
      })
    }
  }, [open])
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1">
        <Link to={"/portfolio/main/" + sender?.id + "/project"} className="link link-primary flex items-center gap-1">
          <Avatar user={sender} size="xs" />
          {sender?.name}
        </Link>
        <p>
          {t("notify.message.applyPro")}
        </p>
      </span>

      <p className="flex gap-2">
        <button className="btn btn-xs btn-success" onClick={() => {
          approve && approve(sender.id)
          mark && mark(id)
        }}>
          {t("notify.approve")}
        </button>
        <button className="btn btn-xs btn-error" onClick={() => setOpen(prev => !prev)}>
          {t("notify.reject")}
        </button>
        <Link to={"/portfolio/main/" + sender?.id + "/project"} className="btn btn-xs">
          {t("userCenter.portfolio")}
        </Link>
      </p>
      {
        open &&
        <form className="mt-3 join flex" onSubmit={event => {
          event.preventDefault()
          reject && reject(sender.id, ref.current?.value ?? "")
          mark && mark(id)
        }}>
          <input ref={ref} className="input input-bordered input-sm join-item flex-1" placeholder={t("notify.rejectPlacehold")} />
          <button type="submit" className="btn btn-sm join-item btn-primary">{t("notify.send")}</button>
        </form>
      }
    </div>
  )
}

export function RejectNotication ({ id, reason, mark }: { id: number, reason?: string, mark?: (id: number) => void }) {
  const { t } = useTranslation()
  return (
    <span className="flex flex-col gap-1">
      <p>
        {t("notify.message.rejectPro")}
      </p>
      {
        reason &&
        <p>
          <b>{t("notify.reason")}:{reason}</b>
        </p>
      }
      <p className="flex">
        <Link to="/dashboard/applydesigner" className="btn btn-primary btn-xs" onClick={() => {
          mark && mark(id)
        }}>{t("notify.applyAgain")}</Link>
      </p>
    </span>
  )
}

export function BecomeProNotication ({ id, mark }: { id: number, mark?: (id: number) => void }) {
  const { t } = useTranslation()
  return (
    <span className="flex flex-col gap-1">
      <p>
        {t("notify.message.becomePro")}
      </p>
      <p className="flex">
        <button className="btn btn-success btn-xs" onClick={() => {
          mark && mark(id);
          setTimeout(() => {
            location.reload()
          }, 100)
        }}>{t("refresh")}</button>
      </p>
    </span>
  )
}

export function OfferNotication () {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1">
      <p>
        {t("notify.message.offer")}
      </p>
    </span>
  )
}

export function RejectJobNotication ({ designer, reason, demand }: { designer: UserProps, reason: string, demand: string }) {
  const { t } = useTranslation()
  const { demandId } = JSON.parse(demand)
  if (!designer?.id || !designer?.name) return <>{reason}</>
  return (
    <span className="flex flex-col gap-1">
      <p>
        <Link to={"/portfolio/main" + designer.id}>{designer.name}</Link> {t("notify.message.rejectJob")}
      </p>
      {
        reason &&
        <p>
          Reason: {reason}
        </p>
      }
      <p className="flex">
        <Link to={"/dashboard/admin/work/" + demandId + "/detail"} className="btn btn-error btn-xs">{t("gotoDetail")}</Link>
      </p>
    </span>
  )
}

export function AcceptJobNotication ({ designer }: { designer: UserProps }) {
  const { t } = useTranslation()
  if (!designer?.name) return <>{designer}</>

  return (
    <span className="flex flex-col gap-1">
      <p>
        {designer.name} {t("notify.message.acceptJob")}
      </p>
      <p className="flex">
        <Link to={"/dashboard/designer/orders/all"} className="btn btn-success btn-xs">{t("gotoDetail")}</Link>
      </p>
    </span>
  )
}

export function CommonNotication ({ sender, title, content }: {
  sender: UserProps, title?: string, content?: string
}) {
  if (!sender?.id || !sender?.email) return <>{sender} </>

  return (
    <span className="flex items-center gap-1">
      <Link to={"/portfolio/main" + sender?.id} className="link link-primary flex items-center gap-1">
        <Avatar user={sender} size="xs" />
        {sender?.name}:
      </Link>
      <p>
        {title ?? ""}  {content ?? ""}
      </p>
    </span>
  )
}

export function NoticationOperator ({ id, status, remove, mark }:
  { id: number, status: number, remove: (id: number) => void, mark: (id: number) => void }) {
  return (
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 ease-in-out duration-150 justify-end">
      {
        status === 0 &&
        <button onClick={() => mark(id)}>
          <EyesIcon size={4} />
        </button>
      }
      <button onClick={() => remove(id)}>
        <RemoveIcon size={4} />
      </button>
    </div>
  )
}