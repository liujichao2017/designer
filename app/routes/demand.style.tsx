//@ts-nocheck
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { useService } from "~/services/services.server";
import { useAppearanceStore, useDemandState } from "~/utils/store";
import { PhotoProvider } from "react-photo-view";
import { useEffect, useState, useTransition } from "react";
import PairedDialog from "~/components/form/demand/PairedDialog";
import { useTranslation } from "react-i18next";
import { formatMoney, range } from "~/utils/helpers";
import NewSelectableImage from "~/components/ui/NewSelectableImage";
import { ResultCode } from "~/utils/result";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GlobalLoading } from "~/components/ui/Loading";
import { CloseIcon } from "~/components/ui/Icons";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/Tooltip";
import { categoryMapper } from "~/utils/definition";
import { cn } from "~/lib/utils";


export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

export async function loader ({ request }: LoaderArgs) {
  const { searchParams } = new URL(request.url)

  const level = searchParams.get("l") ?? "-1"
  const category = searchParams.get("c") ?? "-1"
  const service = useService("picture")
  const pictureList = await service.getPublicPicturesByDemand(+category, +level)
  const categories = await service.getCategorys()
  const tags = await service.getTags()
  return json({ pictureList, categories, tags })

}

export const action = async (args: ActionArgs) => {
  const { request } = args
  const form = await request.formData()
  if (form.get('_action') == 'getPictureList') {
    const pictureList = await useService('picture').getPublicPicturesByDemand(form.get('category'), form.get('level'))
    return json({ code: ResultCode.OK, msg: 'getPictureList', data: { pictureList } })
  }
}

export default function Page () {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const { pictureList, categories, tags } = useLoaderData<typeof loader>()
  const lang = useAppearanceStore(s => s.lang)
  const [selectedImages, setSelectImages, designOption, setDesigner] = useDemandState(state => [state.selectedImages, state.setSelectImages, state.design, state.setDesigner])
  const service = useDemandState(s => s.service)
  const [searchParams, setSearchParams] = useSearchParams()
  const [errors, setErrors] = useState("")
  const [tab, setTab] = useState(-10)
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const query = useFetcher()
  const selectImage = (id: number, checked: boolean) => {
    setErrors("")
    if (!checked) {
      setErrors("")
      setSelectImages(selectedImages?.filter(val => val.id !== id)!)
    } else {
      if (selectedImages?.length >= 5) {
        setErrors("1")
      } else {
        const pic = pictureList?.filter(val => val.id === id).at(0)
        if (pic) setSelectImages([...selectedImages, { id: pic?.id ?? 0, image: pic?.img_url ?? "", thumbnail: pic.litpic_url ?? "" }])
      }
      // const pic = pictureList?.filter(val => val.id === id).at(0)
      // if (pic) {
      //   let items = [...selectedImages, { id: pic?.id ?? 0, image: pic?.img_url ?? "", thumbnail: pic.litpic_url ?? "" }]
      //   items = items.length > 5 ? items.slice(1, 6) : items
      //   setSelectImages(items)
      // }
    }
  }
  const changeCategory = (id: number) => {
    setSearchParams(prev => {
      prev.set("c", id + "")
      return prev
    })
  }
  const changeLevel = (level: number) => {
    setSearchParams(prev => {
      prev.set("l", level + "")
      return prev
    })
  }

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  const [_, startTransition] = useTransition()
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.designers) {
      setDesigner(fetcher.data?.designers.at(0))
      startTransition(() => {
        navigate(`/demand/confirm?${searchParams.toString()}&ids=${fetcher.data?.designers.map(val => `${val.id}:${val.__score ?? 0}`).join(",")}`)
      })
    }
  }, [fetcher])

  useEffect(() => {
    query.load(`/api/demand?loader=quotationPlain&pictures=${selectedImages.map(val => val.id).join(",")}&type=${designOption?.type}&pages=${designOption?.pages}&size=${designOption?.size}&service=${service}&suite=${designOption?.suite ?? -1}&t=${Date.now()}`)
  }, [selectedImages])

  return (
    <>
      <GlobalLoading />
      <div className="w-full">
        {
          step === 0 &&
          <>
            <div className="bg-base-200 py-10 lg:px-[10rem] px-3 relative flex flex-col gap-4">
              <div className="text-lg font-semibold">{t("requirementSlogin.6")}</div>
              <div className="mt-5">
                <p className="font-medium">{t("requirementSlogin.7")}</p>
                <p className="font-medium">{t("requirementSlogin.8")}</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="w-20">{t('category')}：</div>
                  <span
                    className={`cursor-pointer ${searchParams.get("c") === "-1" || !searchParams.has("c") ? 'text-primary' : ''}`}
                    onClick={() => {
                      changeCategory(-1)
                    }}>{t("all")}</span>

                  {
                    tags.category.map((value) => {
                      return (
                        <span
                          className={`cursor-pointer ${searchParams.get("c") === value.id + "" ? 'text-primary' : ''}`}
                          onClick={() => {
                            changeCategory(value.id)
                          }}>{lang === "cht" ? value.cht ?? value.name : lang === "zh" ? value.zh ?? value.name : value.name}</span>)
                    })
                  }
                </div>
                {/* <div className="flex items-center flex-wrap gap-2">
                  <div className="w-20">{t('level')}：</div>
                  <span
                    className={`cursor-pointer ${searchParams.get("l") === "-1" || !searchParams.has("l") ? 'text-primary' : ''}`}
                    onClick={() => {
                      changeLevel(-1)
                    }}>{t("all")}</span>

                  {range(7, 1).map((value, index) => {
                    return (<span
                      className={`cursor-pointer ${searchParams.get("l") === value + "" ? 'text-primary' : ''}`}
                      onClick={() => {
                        changeLevel(value)
                      }}>{t("level")}{value}</span>)
                  })}
                </div> */}
              </div>
              <div className="absolute right-10 top-20 text-base-content cursor-pointer hidden lg:block"
                onClick={() => navigate("/demand/confirm?" + searchParams.toString())}>{t('jump')}
              </div>
            </div>
            <div className="lg:px-[10rem] px-2 sticky top-0 pb-3 pt-2 z-[188] bg-base-200 shadow-sm">
              <div className="mt-2.5 flex gap-8 items-center">
                <div className="flex gap-1">
                  {t('selected')}
                  <Tooltip>
                    <TooltipTrigger>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-point">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent className="z-[400]">
                      <div className="px-2 py-1 rounded-md bg-base-content/80 text-base-100 text-sm font-light">
                        {t("demand.sortTip")}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <span>:  </span>
                  <b>{selectedImages.length}</b>
                </div>

                <span className={cn("text-error", errors ? "opacity-100" : "opacity-0")}>{t("demand.preferenceMaxCount")}</span>

                {
                  selectedImages.length &&
                  <button className="link"
                    onClick={_ => setSelectImages([])}
                  >
                    {t("cleanSelection")}
                  </button> || <></>
                }

              </div>
              <div className="flex mt-2.5">
                <DragDropContext onDragEnd={(result) => {
                  if (!result.destination) {
                    return
                  }

                  const items = reorder(
                    selectedImages,
                    result.source.index,
                    result.destination.index
                  );

                  setSelectImages(items)
                }}>
                  <AnimatePresence>

                    <StrictModeDroppable droppableId="droppable" direction="horizontal">
                      {(provided) => (<div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex gap-2.5 justify-between lg:justify-start"
                      >
                        {selectedImages.map((value, index) => (
                          <motion.div
                            key={value.id}
                            initial={{ opacity: 0, y: 2, rotate: Math.random() * 20 - 10 }}
                            animate={{ opacity: 1, y: 0, rotate: 0 }}
                            exit={{ opacity: 0, y: -2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Draggable draggableId={value.id + ""} index={index}>
                              {(provided) => (
                                <div
                                  className="border-2 rounded-lg border-base-200 cursor-pointer relative"
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <div className="absolute top-0 right-0 mt-[-0.5rem] mr-[-0.5rem] z-10 rounded-full bg-base-100/95 cursor-pointer shadow-md"
                                    onClick={_ => {
                                      const newImages = selectedImages.filter(item => item.id !== value.id)
                                      setSelectImages(newImages)
                                      setErrors("")
                                    }}>
                                    <CloseIcon size={4} />
                                  </div>
                                  <img src={value.thumbnail} className="w-16 h-16 object-cover lg:w-20 lg:h-20" />
                                </div>
                              )}
                            </Draggable>
                          </motion.div>

                        ))}
                        {provided.placeholder}
                      </div>)}
                    </StrictModeDroppable>
                  </AnimatePresence>
                </DragDropContext>
              </div>
            </div>
            <div
              className="fixed z-[299] bg-base-100 left-0 right-0 bottom-0 px-5 lg:h-20 py-2 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 shadow-[0px_-6px_12px_0px_rgba(52,92,160,0.05)]">
              <div className="flex gap-4">
                {
                  query.state === "loading" && <span className="loading loading-dots loading-md"></span>
                }
                {
                  query.state === "idle" && query.data?.quotation && query.data?.quotation?.totalPrice &&
                  <>
                    <div className="flex flex-col">
                      {
                        query.data?.quotation?.levels &&
                        <div className="text-sm text-base-content/50">{t("demand.totalPrice")}：
                          <span className="text-base-content">
                            {/* HK${formatMoney(query.data?.quotation?.totalPrice, 2)} */}
                            HK$
                            {
                              `${formatMoney(query.data?.quotation?.totalPrice / query.data?.quotation?.levels[query.data?.level] * query.data?.quotation?.levels[2] * (1 - query.data?.quotation?.discount ?? 0))}-${formatMoney(query.data?.quotation?.totalPrice / query.data?.quotation?.levels[query.data?.level] * query.data?.quotation?.levels[5] * (1 - query.data?.quotation?.discount ?? 0))}`
                            }
                          </span>
                        </div>
                      }
                      {
                        // query.data?.quotation?.discount &&
                        // <div className="text-sm text-base-content/50">{t("demand.discountPrice")}：
                        //   <span className="text-base-content">
                        //     HK${formatMoney(query.data?.quotation?.totalPrice * (1 - query.data?.quotation?.discount ?? 0), 2)} ({(1 - query.data?.quotation?.discount) * 100}%)
                        //   </span>
                        // </div>
                      }

                      {/* <div className="text-sm text-base-content/50">{t("demand.level")}：
                        <span className="text-base-content">
                          {query.data?.level ?? "--"}
                        </span>
                      </div> */}
                    </div>
                    {
                      !!query.data?.quotation?.levels &&
                      <div className="flex items-center gap-2">
                        {/* <Tooltip>
                          <TooltipTrigger>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-point">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent className="z-[400]">
                            <div className="px-2 py-1 rounded-md bg-base-content/80 text-base-100 text-sm font-light">
                              {t("demand.feeTip")}
                            </div>
                          </TooltipContent>
                        </Tooltip> */}
                        {/* <Tooltip>
                          <TooltipTrigger>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-pointer">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                            </svg>

                          </TooltipTrigger>

                          <TooltipContent className="z-[399]">
                            <div className="flex flex-col gap-1 bg-base-content/80 rounded-md text-sm text-base-100 p-2 font-light shadow-md">
                              {
                                Object.entries(query.data?.quotation?.levels).map(([lv, radio]) =>
                                  <span key={lv}>
                                    Level {lv} : HK${formatMoney(query.data?.quotation?.totalPrice / query.data?.quotation?.levels[query.data?.level] * radio)}
                                  </span>
                                )
                              }
                            </div>
                          </TooltipContent>
                        </Tooltip> */}
                      </div>
                    }
                  </>

                }
              </div>
              <div className="flex justify-end">
                <a className="border-2 border-[#dcdcdc] text-[#565656] rounded-lg px-5 h-10 leading-10 cursor-pointer"
                  onClick={() => {
                    navigate("/demand/requirement/1?" + searchParams.toString())
                  }}>{t('demand.back')}</a>
                <button type="submit"
                  className="bg-[#2F4CDD] rounded-lg px-5 h-10 leading-10 text-white cursor-pointer ml-5"
                  onClick={() => {
                    if (designOption?.type === 3) {
                      navigate("/demand/confirm?" + searchParams.toString())
                      return
                    }
                    if (selectedImages.length > 5) {
                      setErrors("10")
                    } else {
                      fetcher.submit({
                        "_action": "recommentByPictures",
                        ids: selectedImages?.map(val => val.id ?? 0).join(","),
                        category: categoryMapper.get(+(searchParams.get("c"))) ?? -1
                      }, {
                        method: "post",
                        action: "/api/demand"
                      })
                    }
                  }}>{t('demand.next')}
                </button>
              </div>
            </div>


            <div className="lg:px-[10rem] px-2 mt-2.5 pb-20 w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xxl:grid-cols-6 gap-x-4 gap-y-4 pb-4">
                <PhotoProvider>
                  {
                    pictureList?.map((image) =>
                      <NewSelectableImage
                        key={image.id} thumbnail={image.litpic_url} id={image.id}
                        level={image.level || 0} tags={image.tags} image={image.img_url ?? ""}
                        index={
                          selectedImages.map(val => val.id).includes(image.id) ?
                            selectedImages.map(val => val.id).indexOf(image.id) + 1 :
                            0
                        }
                        selected={selectedImages?.map(val => val.id).includes(image.id)}
                        change={selectImage}
                      />
                    )
                  }
                </PhotoProvider>
              </div>
            </div>

            <PairedDialog onSubmit={() => { }} recomments={fetcher.data?.designers ?? []} />

          </>
        }

      </div>
    </>
  )
}
