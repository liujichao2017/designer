import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ContactValidator } from "~/utils/validators"
import { useDemandState } from "~/utils/store"
import { useNavigate, useSearchParams } from "@remix-run/react"
import { useTranslation } from "react-i18next"
import Logo from "~/images/logo-sm.png"
import Footer from "~/components/layout/Footer"


export default function ({ sid, designerId }: { sid?: string, designerId?: string }) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    mode: "onSubmit",
    resolver: zodResolver(ContactValidator),
  })

  const { t } = useTranslation()

  const navigate = useNavigate()

  const [setId, setContact, contact, reset] = useDemandState(state => [state.setId, state.setContact, state.contact, state.reset])
  const [searchParams,] = useSearchParams()
  console.log("searchParams",searchParams)
  const params = searchParams.get("params") ?? "{}"
  let user = JSON.parse(params)

  return (
    <form onSubmit={handleSubmit(data => {
      if (data.name === "!!reset??") {
        return reset()
      }
      setContact(data as z.infer<typeof ContactValidator>)
      setId(sid || searchParams.get("sid") || "")
      const query = new URLSearchParams(searchParams)
      query.set("sid", sid || searchParams.get("sid") || "")
      if(designerId && parseInt(designerId) > 0 ){
        query.set("fromDesigner", "y")
        query.set("designerId", designerId)
      }
      navigate("/demand/requirement/1?" + query.toString())
    })}>
      <div className="flex items-center flex-wrap py-20">
        <div className="lg:w-[60%] w-full">
          <div>
            <img src={require('@/images/slogin.png')} className="w-64  m-auto" />
            <img src={Logo} alt="Logo" title="Definer tech" className="w-24 m-auto mt-5" />
            <p className="text-xl text-center leading-8 mt-7">{t('requirementSlogin.0')}</p>
            <p className="text-xl text-center leading-8">{t('requirementSlogin.1')}</p>
          </div>
        </div>
        <div className="lg:w-[40%] w-full flex items-center lg:justify-start justify-center">
          <div className="m-10">
            <div className="font-bold text-base">{t('requirementSlogin.2')}</div>
            <div
              className="text-[#86868B] text-sm mt-2.5">{t('requirementSlogin.3')}
            </div>
            <div className="mt-10">
              <div className="flex items-center h-10">
                <div className="text-error mr-2 text-lg font-bold">*</div>
                <div>{t(`demand.name`)}</div>
              </div>
              <input type="text" {...register("name")}
                className={`outline-0 rounded-lg border ${errors.name?.message ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
                placeholder={t("demand.name")}
                defaultValue={user?.name ?? contact?.name ?? ""}
              />
              {errors.name?.message ? (
                <div
                  className="leading-10 text-red-500">{errors.name?.message as string}</div>) : ''}
              <div className="flex items-center h-10">
                <div className="text-error mr-2 text-lg font-bold">*</div>
                <div>Whatsapp</div>
              </div>
              <input type="text" {...register("whatsapp")}
                className={`outline-none rounded-lg border ${errors.whatsapp?.message ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5`}
                placeholder="Enter whatsapp"
                defaultValue={user?.whatsapp ?? contact?.whatsapp ?? ""}
              />
              {errors.whatsapp?.message ? (
                <div
                  className="leading-10 text-red-500">{errors.whatsapp?.message as string}</div>) : ''}
              <div className="flex items-center h-10">
                <div className="text-error mr-2 text-lg font-bold">*</div>
                <div>{t(`demand.email`)}</div>
              </div>
              <input type="text" {...register("email")}
                className={`rounded-lg border ${errors.email?.message ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 outline-none`}
                placeholder={t("demand.email")}
                defaultValue={user?.email ?? contact?.email ?? ""}
              />
              {errors.email?.message ? (
                <div
                  className="leading-10 text-red-500">{errors.email?.message as string}</div>) : ''}
            </div>

            <div className="mt-6">
              <button type="submit"
                className="bg-primary rounded-lg px-5 h-10 leading-10 text-white cursor-pointer">{t('startDemand')}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* <div
        className="fixed left-0 right-0 bottom-0 px-5 h-20 flex justify-between items-center shadow-[0px_-6px_12px_0px_rgba(52,92,160,0.05)] bg-base-100">
        <div></div>
        <button type="submit"
          className="bg-[#2F4CDD] rounded-lg px-5 h-10 leading-10 text-white cursor-pointer">{t('startDemand')}
        </button>
      </div> */}

    </form>
  )
}