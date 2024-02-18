import { LoaderArgs, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PhotoProvider, PhotoView } from "react-photo-view";
import CustomerServiceDialog from "~/components/form/demand/CustomerServiceDialog";
import Avatar from "~/components/ui/Avatar";
import { getDesignersByPictures } from "~/services/logic.server";
import { categoryMapper } from "~/utils/definition";
import { ResultCode } from "~/utils/result";
import { UserProps, useDemandState } from "~/utils/store";

export async function loader ({ request }: LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const ids = (searchParams.get("ids") ?? "").split(",").map(v => +v)
  const c = +(searchParams.get("c") ?? "-1")
  const category = categoryMapper.get(+(searchParams.get("c"))) ?? -1
  const page = +(searchParams.get("p") ?? "1")
  const designers = await getDesignersByPictures(ids, -1, category, page)
  console.log(designers)
  console.log(ids, category, page)
  return json({
    designers
  })
  // const ids = searchParams.get("ids")?.split(",").map((it) => {
  //   const [id, __score] = it.split(":")
  //   return { id: +id, __score: +__score }
  // })
  // const designers = await useService("picture").getDesignerByIds(ids?.map(val => +val?.id || 0) ?? [])
  // return json({
  //   designers: designers.sort((a, b) => {
  //     const ascore = ids.find(val => +val.id === a.id)?.__score
  //     const bscore = ids.find(val => +val.id === b.id)?.__score
  //     if (ascore > bscore) return -1
  //     if (ascore < bscore) return 1
  //     return 0
  //   })
  // })
}

type LevelResult = { id: number, level: number }

export default function () {
  const { t } = useTranslation()
  const { designers } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [searchParams,] = useSearchParams()
  const [setDesigner, resetDesigner] = useDemandState(state => [state.setDesigner, state.resetDesigner])
  const query = useFetcher()

  useEffect(() => {
    // query.load(`/api/user?loader=categoryLevel&ids=${designers.map(v => v.id).join(",")}&category=${searchParams.get("c")}`)
  }, [designers])
  return (
    <>
      <div className="bg-base-200 py-10 lg:px-[18rem] px-6 flex flex-col justify-center w-full">
        <div className="text-lg font-semibold">{t("requirementSlogin.9")}</div>
        <div className="mt-5">
          <p className="font-medium">
            {t("requirementSlogin.10")}
          </p>
        </div>
      </div>
      <div className="lg:px-[18rem] px-4 pb-[12rem]">
        {
          designers?.map(val =>
            <div key={val.id} className="mt-6 border-b-2 border-[#E5E6EB] pb-8">
              <div className="flex flex-col gap-6">

                <div className="flex justify-between flex-wrap gap-4 items-center">
                  <Link className="flex items-center gap-4" to={"/portfolio/" + val.id}>
                    <Avatar user={val as UserProps} />
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-xl">{val.name ?? ""}</div>
                      <div className="flex gap-2 items-center">
                        <small className="font-light text-base-content/50 text-[0.75rem] flex gap-1 items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                          </svg>
                          {val._score}
                        </small>
                        {
                          // query.state === "idle"
                          // && query.data?.code === ResultCode.OK
                          // && query.data?.levels?.find((v: LevelResult) => v.id === val.id) &&
                          // <div className="badge badge-secondary badge-sm">Level {query.data?.levels?.find((v: LevelResult) => v.id === val.id).level}</div>

                        }
                      </div>
                    </div>

                  </Link>
                  <div className="flex items-end">
                    {/* <button className="border-2 border-[#dcdcdc] text-[#565656] rounded-lg px-5 h-10 leading-10 cursor-pointer"
                    onClick={() => {
                      (window as any).customerServiceDialog.showModal()
                    }}>{t("demand.contact")}
                  </button> */}
                    <button className="bg-[#2F4CDD] rounded-lg px-5 h-10 leading-10 text-white cursor-pointer ml-5"
                      onClick={() => {
                        const designer = { id: val.id, name: val.name ?? "", avatar: val.avatar ?? "", email: val.email ?? "" }
                        setDesigner(designer)
                        navigate("/demand/confirm?" + searchParams.toString())
                      }}>{t("demand.chooseDesigner")}</button>
                  </div>
                </div>

                <div>{val?.profile?.description}</div>

              </div>
              <div className="mt-5">
                <PhotoProvider>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-4">
                    {
                      val.portfolios?.map((p) => {
                        return (
                          <PhotoView
                            key={p.id}
                            src={p.img_url ?? p.thumbnail_url}
                          >
                            <img
                              src={p.thumbnail_url ?? p.img_url}
                              className="rounded-lg object-cover cursor-pointer" />
                          </PhotoView>
                        )
                      })
                    }
                  </div>
                </PhotoProvider>
              </div>
            </div>
          )
        }
      </div>

      <CustomerServiceDialog />

      <div
        className="fixed z-[999] bg-base-100 left-0 right-0 bottom-0 px-5 h-20 flex justify-between items-center shadow-[0px_-6px_12px_0px_rgba(52,92,160,0.05)]">
        <div></div>
        <div className="flex">
          <button className="border-2 border-[#dcdcdc] text-[#565656] rounded-lg px-5 h-10 leading-10 cursor-pointer"
            onClick={() => {
              const sp = new URLSearchParams(searchParams)
              sp.delete("ids")
              navigate("/demand/style?" + sp.toString())
            }}>
            {t("prevStep")}
          </button>
          <button type="submit"
            className="bg-[#2F4CDD] rounded-lg px-5 h-10 leading-10 text-white cursor-pointer ml-5"
            onClick={() => {
              resetDesigner()
              navigate("/demand/confirm?" + searchParams.toString())
            }}>{t("demand.designerFrom")}</button>
        </div>
      </div>
    </>
  )
}
