//@ts-nocheck
import { useFetcher } from "@remix-run/react"
import { useCallback, useEffect, useState } from "react"
import type { NotifyAction, NotifyLoader } from "~/routes/api.notify"
import { ResultCode } from "~/utils/result"
import { UserProps } from "~/utils/store"
import { useTranslation } from "react-i18next"
import { AcceptJobNotication, ApplyNotication, BecomeProNotication, CommonNotication, NoticationOperator, OfferNotication, RejectJobNotication, RejectNotication } from "./NotifyItem"
import { AnimatePresence, motion } from "framer-motion"
import { randCode } from "~/utils/helpers"
import { NotifyType } from "~/utils/definition"

export default function NotifyList () {
  const [tab, setTab] = useState(1)
  const [notifies, setNotifies] = useState([])
  const query = useFetcher<NotifyLoader>()
  const mutation = useFetcher<NotifyAction>()
  const load = (url: string) => query.load(url + "&t=" + randCode())
  const { t } = useTranslation()
  useEffect(() => {
    setNotifies([])
    if (tab === 0) load("/api/notify?loader=all")
    if (tab === 1) load("/api/notify?loader=unread")
  }, [tab])

  useEffect(() => {
    if (tab === 0) load("/api/notify?loader=all")
    if (tab === 1) load("/api/notify?loader=unread")
  }, [])

  useEffect(() => {
    if (query.state === "idle" && query.data?.code === ResultCode.OK) {
      if (query.data?.notifies?.length)
        setNotifies(prev => [...prev, ...query.data?.notifies.filter(v => v.sender && v.owner)])
    }
  }, [query])

  useEffect(() => {
    tab === 1 && setNotifies([])
  }, [mutation])

  const more = useCallback(() => {
    const url = tab === 0 ? "/api/notify?loader=all" : "/api/notify?loader=unread"
    query.load(url + "&last=" + notifies.at(-1).id)
  }, [notifies])

  const allReaded = useCallback(() => {
    mutation.load("/api/notify?loader=markAllReaded")
  }, [])

  const remove = useCallback((id: number) => {
    query.load("/api/notify?loader=remove&id=" + id)
    setNotifies(prev => prev.filter(val => val.id !== id))
  }, [])

  const mark = useCallback((id: number) => {
    query.load("/api/notify?loader=markReaded&id=" + id)
    setNotifies(prev => prev.map(val => val.id === id ? { ...val, status: 1 } : val))
    if (tab === 1) setNotifies(prev => prev.filter(val => val.id !== id))
  }, [tab])

  const approve = useCallback((id: number) => {
    query.load(`/api/notify?loader=approve&id=${id}&t=${randCode()}`)
  })

  const reject = useCallback((id: number, reason: string) => {
    query.load(`/api/notify?loader=reject&id=${id}&reason=${reason}&t=${randCode()}`)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="tabs">
        <a
          className={`tab tab-lifted ${tab === 0 && "tab-active"}`}
          onClick={() => setTab(0)}
        >{t("notify.all")}</a>
        <a
          className={`tab tab-lifted ${tab === 1 && "tab-active"}`}
          onClick={() => setTab(1)}
        >{t("notify.unread")}</a>
      </div>

      <div className="flex flex-col gap-2">

        <AnimatePresence>
          {
            notifies.map((notify, i) =>
              <motion.div
                key={notify.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <NotifyItem {...notify}
                  remove={remove} mark={mark}
                  approve={approve} reject={reject} />
              </motion.div>
            )
          }
        </AnimatePresence>


        {
          notifies.length &&
          <div className="flex justify-center text-xs font-semibold">
            <button className="link link-primary" onClick={more}>{t("notify.loadMore")}</button>
          </div> ||
          <div className="flex justify-center text-xs font-semibold">
            {t("notify.empty")}
          </div>
        }

        <span className={`flex justify-center text-xs ${query.state === "loading" && "opacity-100" || "opacity-0"}`}>{t("submission.loading")}</span>

        <div className="pb-6"></div>
        <div className="fixed bottom-1 flex justify-center self-center w-[95%] pb-2 bg-base-100">
          <button className="btn btn-sm btn-wide" onClick={allReaded}>{t("notify.markAllReaded")}</button>
        </div>
      </div>
    </div>
  )
}

export function NotifyItem ({ id, status, type, sender, title, content, remove, mark, approve, reject }:
  {
    id: number, status: number, type: NotifyType,
    sender?: UserProps, title?: string, content?: string,
    remove: (id: number) => void, mark: (id: number) => void,
    approve: (id: number) => void, reject: (id: number, reason: string) => void
  }
) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-3 justify-between items-center rounded-md hover:bg-base-200 p-2">
      <div className="flex flex-col flex-1 gap-1 text-xs">
        {
          type === NotifyType.TYPE_COMMON_NOTIFY ?
            <h5 className="font-bold">{t("notify.private")}</h5> :
            <h5 className="font-bold">{t("notify.system")}</h5>
        }

        {
          type === NotifyType.TYPE_APPLY_FOR_PRO &&
          <div className="flex flex-col group">
            <ApplyNotication sender={sender} id={id} approve={approve} reject={reject} mark={mark} />
            <NoticationOperator id={id} status={status} remove={remove} mark={mark} />
          </div>
        }

        {
          (type === NotifyType.TYPE_REJCT_FOR_PRO || type === NotifyType.TYPE_REJECT) &&
          <div className="flex flex-col group">
            <RejectNotication reason={title || content} id={id} mark={mark} />
            <NoticationOperator id={id} status={status} remove={remove} mark={mark} />
          </div>
        }

        {
          type === NotifyType.TYPE_BECOME_PRO &&
          <div className="flex flex-col group">
            <BecomeProNotication id={id} mark={mark} />
            <NoticationOperator id={id} status={status} remove={remove} mark={mark} />
          </div>
        }

        {
          type === NotifyType.TYPE_SEND_OFFER &&
          <div className="flex flex-col group">
            <OfferNotication />
            <NoticationOperator id={id} status={status} remove={remove} mark={mark} />
          </div>
        }

        {
          type === NotifyType.TYPE_COMMON_NOTIFY &&
          <div className="flex flex-col group">
            <CommonNotication sender={sender} title={title} content={content} />
            <NoticationOperator id={id} status={status} remove={remove} mark={mark} />
          </div>
        }

        {
          type === NotifyType.TYPE_REJECT_DEMAND &&
          <div className="flex flex-col group">
            <RejectJobNotication designer={sender} demand={content} reason={title} />
            <NoticationOperator send remove={remove} mark={mark} />
          </div>
        }

        {
          type === NotifyType.TYPE_ACCEPT_DEMAND &&
          <div className="flex flex-col group">
            <AcceptJobNotication designer={sender} />
            <NoticationOperator send remove={remove} mark={mark} />
          </div>
        }
      </div>

      <div className="hidden">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  )
}