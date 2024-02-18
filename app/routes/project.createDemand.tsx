import { useCallback } from "react"
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node"
import { useFetcher } from "@remix-run/react"
import DesignLogo from "~/images/designpro-logo.png"
import { isAuthenticated } from "~/utils/sessions.server"
import { ResultCode } from "~/utils/result"
import { encrypto } from "~/utils/crypto.server"

export async function action (args: ActionArgs) {
  const { request } = args
  const { searchParams } = new URL(request.url)
  const user = await isAuthenticated(args)
  let id = searchParams.get("id") || user?.id || 0
  const sid = encrypto({ ts: Date.now(), id })
  return redirect(`${process.env.END_POINT}/demand/requirement?sid=${sid}&platform=2`)
}

export default function Page () {
  const mutation = useFetcher()
  const gotoDemand = useCallback(() => {
    mutation.submit({}, { method: "POST" })
  }, [])
  return (
    <main className="flex flex-col lg:gap-8 bg-base-200 min-h-screen">
      <div className="flex justify-between items-center sticky top-0 backdrop-blur-sm bg-base-100/70 mb-2 z-10 py-5 px-8">
        <img src={DesignLogo} alt="Logo" title="Definer tech" className="h-9" />
      </div>
      <section className="flex flex-col w-full items-center pt-10 justify-self-center">
        <div className="flex flex-col gap-8 bg-base-100 lg:rounded-lg w-full lg:w-5/6 p-10 pb-20">
          <div className="flex justify-center">
            <img src={DesignLogo} alt="Logo" title="Definer tech" className="h-14" />
          </div>
          <div className="flex flex-col items-center gap-3 text-sm">
            <p>請填寫表格以獲取報價，只需 1 分鐘。</p>
            <p>使用系統填寫需求以獲最大折扣優惠。</p>
            <p>HK Design Pro 優質、優惠、優越</p>
          </div>

          <div className="flex justify-center text-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">
              <button className="btn h-[3.05rem] rounded-full w-[18rem] bg-base-100 border-base-content/20 hover:border-primary/30" onClick={gotoDemand}>只設計</button>
              <button className="btn h-[3.05rem] rounded-full w-[18rem] bg-base-100 border-base-content/20 hover:border-primary/30" onClick={gotoDemand}>設計印刷</button>
              <button className="btn h-[3.05rem] rounded-full w-[18rem] bg-base-100 border-base-content/20 hover:border-primary/30" onClick={gotoDemand}>只印刷</button>
              <a href="https://hkdesignpro.com/others/" target="_blank" className="btn h-[3.05rem] rounded-full w-[18rem] bg-base-100 border-base-content/20 hover:border-primary/30">其他服務</a>
            </div>
          </div>

          <a href="https://api.whatsapp.com/send/?phone=85267548453&text&type=phone_number&app_absent=0" target="_blank" className="w-12 h-12 flex items-center justify-center rounded-full fixed bottom-8 right-8 bg-success/90 shadow-md hover:shadow-lg hover:bg-success duration-150 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-base-100">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>

          </a>
        </div>
      </section>
    </main>
  )
}