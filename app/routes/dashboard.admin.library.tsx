//@ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node"
import { OperatorHeader } from "~/components/layout/Header"
import { useService } from "~/services/services.server"
import { ResultCode, fault } from "~/utils/result"
import { hasRole, isAuthenticated } from "~/utils/sessions.server"
import { Roles, UserProps, useAppearanceStore } from "~/utils/store"
import { useLoaderData } from "react-router"
import { PageError } from "~/components/ui/Errors"
import Tags from "~/components/ui/Tags"
import { BindCategoryValidator, BindLevelValidator, BindTagValidator, IdValidator, NameWithPrefixValidator, RenameExtValidator, UploadValidator } from "~/utils/validators"
import { useFetcher, useSearchParams } from "@remix-run/react"
import Label from "~/components/ui/Label"
import { range } from "~/utils/helpers"
import PictureItem from "~/components/ui/PictureItem"
import { PhotoProvider } from "react-photo-view"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/Popover"
import Pagination from "~/components/ui/Pagination"
import { PlusIcon } from "~/components/ui/Icons"
import UploaderDialog from "~/components/form/UploaderDialog"
import { FileContent } from "~/components/form/Uploader"
import { useShortcutKeys } from "~/utils/hooks"

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/sign")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }

  const { searchParams } = new URL(args.request.url)
  const page = ~~(searchParams.get("page") ?? 1)
  const category = searchParams.get("category") ?? "-1"
  const level = searchParams.get("level") ?? "-1"
  const purpose = searchParams.get("purpose") ?? "-1"
  const organization = searchParams.get("organization") ?? "-1"


  const service = useService("picture", { user })

  return json({
    code: ResultCode.OK,
    tags: await service.getTags(),
    page: await service.getPictureByFilter(page,
      category.split(",").map(val => +val),
      organization.split(",").map(val => +val),
      purpose.split(",").map(val => + val),
      level.split(",").map(val => +val))
  })
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const form = await args.request.json()
  const { _action } = form
  const service = useService("picture", { user })
  switch (_action) {
    case "addTag":
      {
        const result = await NameWithPrefixValidator.safeParseAsync(form)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.addTag(result.data.prefix, result.data.name, result.data.cht, result.data.zh))
      }
    case "removeTag":
      {
        const result = await IdValidator.safeParseAsync(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.removeTag(result.data.id))
      }

    case "remove":
      {
        const result = await IdValidator.safeParseAsync(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.removePictures([result.data.id]))
      }

    case "renameTag":
      {
        const result = RenameExtValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.renameTag(result.data.id, result.data.name, result.data.cht, result.data.zh))
      }

    case "bindTag":
      {
        const result = BindTagValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.bindTag(result.data.ids ?? [], result.data.tagId))
      }

    case "unbindTag":
      {
        const result = BindTagValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.unbindTag(result.data.ids ?? [], result.data.tagId))
      }

    case "bindCategory":
      {
        const result = BindCategoryValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.bindCategory(result.data.ids ?? [], result.data.categoryId))
      }

    case "bindLevel":
      {
        const result = BindLevelValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.bindLevel(result.data.ids ?? [], result.data.level))
      }
    case "upload":
      {
        const result = UploadValidator.safeParse(form)
        if (!result.success) return fault(ResultCode.FORM_INVALID)
        return json(await service.uploadPicturesByAdmin(result.data.contents))
      }
  }
}

export default function Page () {
  const { code, tags, page: { pictures, pages } } = useLoaderData<typeof loader>()
  const prefixRef = useRef(null)

  const [checked, setChecked] = useState<number[]>([])
  const [currentTag, setCurrentTag] = useState<{ id: number, name: string, cht: string, zh: string }>()
  const [tab, setTab] = useState(3)
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()

  const shiftKey = useShortcutKeys(["shift"])
  const [startItem, setStartItem] = useState(-1)

  const levels = searchParams.get("level") && searchParams.get("level").split(",").map(val => +val) || []
  const organization = searchParams.get("organization") && searchParams.get("organization").split(",").map(val => +val) || []
  const purpose = searchParams.get("purpose") && searchParams.get("purpose").split(",").map(val => +val) || []
  const category = searchParams.get("category") && searchParams.get("category").split(",").map(val => +val) || []

  const mutation = useFetcher()

  if (code !== ResultCode.OK) {
    return <PageError />
  }

  const handleAddTag = (prefix: string, en: string, cht: string, zh: string) => {
    mutation.submit({ _action: "addTag", name: en, cht, zh, prefix }, { method: "post", encType: "application/json" })
    tagRef.current!.value = ""
  }

  const handleRemove = (id: number) => {
    mutation.submit({ _action: "removeTag", id }, { method: "post", encType: "application/json" })
  }

  const handleRenameTag = () => {
    if (!currentTag) return
    mutation.submit({ _action: "renameTag", ...currentTag }, { method: "post", encType: "application/json" })
    setCurrentTag(null)
  }

  const changeTag = (tagId: number) => {
    if (checked)
      mutation.submit({ _action: "bindTag", ids: checked, tagId }, { method: "post", encType: "application/json" })
  }

  const unbindTag = (tagId: number) => {
    if (checked)
      mutation.submit({ _action: "unbindTag", ids: checked, tagId }, { method: "post", encType: "application/json" })
  }

  const changeLevel = (level?: number) => {
    if (checked)
      mutation.submit({ _action: "bindLevel", ids: checked, level }, { method: "post", encType: "application/json" })
  }

  const upload = useCallback((files: FileContent[]) => {
    mutation.submit({ _action: "upload", contents: files.map(f => f.src) }, { method: "post", encType: "application/json" })
  }, [])

  const remove = (id: number) => {
    mutation.submit({ _action: "remove", id }, { method: "post", encType: "application/json" })
  }

  const lang = useAppearanceStore(s => s.lang)

  useEffect(() => {
    setChecked([])
  }, [searchParams])

  useEffect(() => {
    const pids = pictures.map(val => val.id)
    const newChecked = checked.filter(val => pids.includes(val))
    setChecked(newChecked)
  }, [pictures])

  const handleSelect = (id, _checked) => {
    _checked && setStartItem(id)
    if (shiftKey) {
      if (startItem !== -1) {
        const range = (startItem < id) ?
          pictures.map(val => val.id).filter(val => val >= startItem && val < id) :
          pictures.map(val => val.id).filter(val => val <= startItem && val > id)
        setChecked(prev => _checked ? [...prev, ...range] : prev.filter(val => !range.includes(val)))
      }
    }
    setChecked(prev => _checked ? [...prev, id] : prev.filter(val => val !== id))
  }

  const everySelected = (tag: { id: number }) => {
    const selected = checked
      .map(id => pictures.find(val => val.id === id))
      .filter(val => val)
      .map(val => val.tags
        .map(it => it.id)
        .includes(tag.id))
    return selected.length && selected.every(val => val)
  }
  return (
    <div className="flex flex-col justify-between flex-1">
      <div className="flex flex-col gap-4 mb-16">
        <OperatorHeader
          title={t("nav.adminLibrary")}
        >
          <button className="btn btn-sm btn-primary" onClick={_ => window.adminUploader.showModal()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {t("upload")}
          </button>
          <UploaderDialog name="adminUploader"
            upload={upload}
            maxItemCount={5} maxItemSize={1024 * 1024 * 5} totalSize={1024 * 1024 * 5 * 5} />
        </OperatorHeader>

        <dialog id="newTagDialog" className="modal" >
          <form method="dialog" className="modal-box" onSubmit={event => {
            const data = Object.fromEntries(new FormData(event.target))
            handleAddTag(prefixRef.current?.value ?? "", data.en ?? "", data.cht ?? "", data.zh ?? "")
          }}>
            <h3 className="font-bold text-lg">{t("library.createTag")}</h3>
            <div className="flex flex-col gap-1">
              <div className="py-4 form-control gap-1">
                <label>{t("category")}</label>
                <select className="select select-bordered" ref={prefixRef}>
                  <option value="category">{t("category")}</option>
                  <option value="organization">{t("demand.organization")}</option>
                  <option value="purpose">{t("demand.purpose")}</option>
                </select>
              </div>
              <div className="py-4 form-control gap-1">
                <label>English Name</label>
                <input type="text" className="input input-bordered" name="en" />
              </div>
              <div className="py-4 form-control gap-1">
                <label>繁体中文名</label>
                <input type="text" className="input input-bordered" name="cht" />
              </div>
              <div className="py-4 form-control gap-1">
                <label>简体中文名</label>
                <input type="text" className="input input-bordered" name="zh" />
              </div>
            </div>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                (window as any)?.newTagDialog?.close()
              }}>{t("cancel")}</a>
              <button type="submit" className="btn btn-primary">{t("ok")}</button>
            </div>
          </form>
        </dialog>

        <dialog id="manageTagDialog" className="modal" >
          <form method="dialog" className="modal-box" onSubmit={_ => {
          }}>
            <h3 className="font-bold text-lg">{t("library.tag")}</h3>
            <div className="py-4 form-control gap-3">
              <div className="flex flex-col gap-1">
                <b>{t("category")}</b>
                <div className="flex gap-2 flex-wrap">
                  {
                    (tags["category"] ?? []).map(tag =>
                      <Label close={() => handleRemove(tag.id)} tap={() => setCurrentTag(tag)}>
                        {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                      </Label>
                    )
                  }
                </div>
              </div>

              <div className="flex flex-col">
                <b>{t("organization")}</b>
                <div className="flex gap-2 flex-wrap">
                  {
                    (tags["organization"] ?? []).map(tag =>
                      <Label key={tag.id} close={() => handleRemove(tag.id)} tap={() => setCurrentTag(tag)}>
                        {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                      </Label>
                    )
                  }
                </div>
              </div>

              <div className="flex flex-col">
                <b>{t("purpose")}</b>
                <div className="flex gap-2 flex-wrap">
                  {
                    (tags["purpose"] ?? []).map(tag =>
                      <Label key={tag.id} close={() => handleRemove(tag.id)} tap={() => setCurrentTag(tag)}>
                        {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                      </Label>
                    )
                  }
                </div>
              </div>
              {
                currentTag &&
                <div className="flex flex-col">
                  <div className="py-2 form-control gap-1">
                    <label>English Name</label>
                    <input type="text" className="input input-bordered" name="name" defaultValue={currentTag.name} onChange={event => {
                      setCurrentTag(prev => ({ ...prev, name: event.target.value }))
                    }} />
                  </div>
                  <div className="py-2 form-control gap-1">
                    <label>繁体中文名</label>
                    <input type="text" className="input input-bordered" name="name" defaultValue={currentTag.cht} onChange={event => {
                      setCurrentTag(prev => ({ ...prev, cht: event.target.value }))
                    }} />
                  </div>
                  <div className="py-2 form-control gap-1">
                    <label>简体中文名</label>
                    <input type="text" className="input input-bordered" name="name" defaultValue={currentTag.zh} onChange={event => {
                      setCurrentTag(prev => ({ ...prev, zh: event.target.value }))
                    }} />
                  </div>

                  <div className="py-2 flex justify-end gap-2">
                    <span className="btn" onClick={() => setCurrentTag(null)}>{t("cancel")}</span>
                    <span className="btn btn-primary" onClick={handleRenameTag}>{t("save")}</span>
                  </div>
                </div>

              }
            </div>
            <div className="modal-action mt-4">
              <button type="submit" className="btn" onClick={() => setCurrentTag(null)}>{t("close")}</button>
            </div>
          </form>
        </dialog>

        <div className="flex flex-col">
          <div className="flex gap-2">
            <div className="tabs">
              <button className={`tab tab-lifted ${tab === 3 && "tab-active"}`} onClick={() => setTab(3)}>{t("category")}</button>
              <button className={`tab tab-lifted ${tab === 1 && "tab-active"}`} onClick={() => setTab(1)}>{t("organization")}</button>
              <button className={`tab tab-lifted ${tab === 4 && "tab-active"}`} onClick={() => setTab(4)}>{t("purpose")}</button>
              <button className={`tab tab-lifted ${tab === 2 && "tab-active"}`} onClick={() => setTab(2)}>{t("level")}</button>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => (window as any)?.newTagDialog.showModal()}>
              <PlusIcon size={4} />
            </button>

            <button className="btn btn-sm btn-ghost" onClick={() => (window as any)?.manageTagDialog.showModal()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {
            tab === 1 &&
            <div
              className="flex flex-wrap bg-base-100 rounded-md gap-2 p-1">
              <Tags tags={[{ id: -1, name: t("all") }, { id: -2, name: t("unsorted") }, ...(tags["organization"] ?? [])]}
                selected={organization}
                onChange={id => {
                  setSearchParams(prev => {
                    if (id < 0) {
                      prev.set("organization", id)
                    } else {
                      const o = organization.filter(val => val > 0)
                      if (organization.includes(id)) {
                        prev.set("organization", o.filter(val => val !== id).join(",") || "-1")
                      } else {
                        prev.set("organization", [id, ...o].join(","))
                      }
                    }
                    setChecked([])
                    return prev
                  })
                }}
              />
            </div>
          }

          {
            tab === 2 &&
            <div
              className="flex flex-wrap bg-base-100 rounded-md gap-2 p-1">
              <button
                className={`btn btn-sm ${(searchParams.get("level") === "-1" || !searchParams.get("level")) && "btn-primary" || "btn-ghost"}`}
                onClick={() => {
                  setSearchParams(prev => {
                    prev.set("level", -1)
                    setChecked([])
                    return prev
                  })
                }}>{t("all")}</button>
              <button
                className={`btn btn-sm ${searchParams.get("level") === "-2" && "btn-primary" || "btn-ghost"} capitalize`}
                onClick={() => {
                  setSearchParams(prev => {
                    prev.set("level", -2)
                    setChecked([])
                    return prev
                  })
                }}>{t("unsorted")}</button>
              {
                range(7, 1).map(level => (
                  <button
                    className={`btn btn-sm ${levels.includes(level) && "btn-primary" || "btn-ghost"} capitalize`}
                    key={level} onClick={() => {
                      setSearchParams(prev => {
                        if (levels.includes(level)) {
                          const lv = levels.filter(val => val !== level)
                          prev.set("level", lv.join(",") || "-1")
                        } else {
                          prev.set("level", [level, ...levels].join(","))
                        }
                        return prev
                      })
                    }}>
                    {t("level")}{level}
                  </button>
                ))
              }
            </div>
          }
          {
            tab === 3 &&
            <div className="flex flex-wrap bg-base-100 rounded-md gap-2 p-1">
              <Tags tags={[{ id: -1, name: t("all") }, { id: -2, name: t("unsorted") }, ...(tags["category"] ?? [])]}
                selected={category}
                onChange={id => {
                  setSearchParams(prev => {
                    if (id < 0) {
                      prev.set("category", id)
                    } else {
                      const p = category.filter(val => val > 0)
                      if (category.includes(id)) {
                        prev.set("category", p.filter(val => val !== id).join(",") || "-1")
                      } else {
                        prev.set("category", [id, ...p].join(","))
                      }
                    }
                    setChecked([])
                    return prev
                  })
                }}
              />
            </div>
          }

          {
            tab === 4 &&
            <div className="flex flex-wrap bg-base-100 rounded-md gap-2 p-1">
              <Tags tags={[{ id: -1, name: t("all") }, { id: -2, name: t("unsorted") }, ...(tags["purpose"] ?? [])]}
                selected={purpose}
                onChange={id => {
                  setSearchParams(prev => {
                    if (id < 0) {
                      prev.set("purpose", id)
                    } else {
                      const p = purpose.filter(val => val > 0)
                      if (purpose.includes(id)) {
                        prev.set("purpose", p.filter(val => val !== id).join(",") || "-1")
                      } else {
                        prev.set("purpose", [id, ...p].join(","))
                      }
                    }
                    setChecked([])
                    return prev
                  })
                }}
              />
            </div>
          }
        </div>


        <div className="flex flex-wrap gap-8">
          <PhotoProvider>
            {
              pictures.map(pic => (
                <PictureItem
                  selected={checked.includes(pic.id)}
                  key={pic.id}
                  createdAt={pic.created_at ?? ""}
                  id={pic.id}
                  name={pic.project_name ?? ""}
                  src={pic.img_url ?? ""}
                  thumbnail={pic.litpic_url ?? ""}
                  owner={pic.owner as UserProps}
                  level={pic.level}
                  tags={pic.tags}
                  select={handleSelect}
                  remove={remove}
                />
              ))
            }
          </PhotoProvider>
        </div>

        <div className="flex justify-center mt-8">
          <Pagination
            totalPages={pages}
            showDirection={true}
            currentPage={+searchParams.get("page") || 1}
            linkGenerator={(page: number) => {
              const sp = new URLSearchParams(searchParams.toString())
              sp.set("page", page)
              return "/dashboard/admin/library?" + sp.toString()
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center shadow-lg p-4 bg-base-100/50 backdrop-blur-sm w-full sticky bottom-0 rounded-t-lg">
        <div className="form-control">
          <label className="label cursor-pointer flex gap-2">
            <input type="checkbox" className="checkbox checkbox-primary"
              checked={checked.length === pictures.length}
              onChange={e => {
                setChecked(e.target.checked ? pictures.map(val => val.id) : [])
              }} />
            <span className="label-text">{t("library.selectAll")}</span>
          </label>
        </div>

        <div className="flex gap-4 items-center">
          <span>
            {t("library.selected")} {checked.length}
          </span>
          <button className="btn btn-sm" onClick={() => setChecked([])}>{t("library.cancelSelect")}</button>
          <Popover>
            <PopoverTrigger>
              <button className="btn btn-sm btn-primary">{t("library.move")}</button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex w-full md:w-[33rem] overflow-y-scroll justify-between gap-2">
                <div className="flex flex-col gap-1 w-1/3 items-center">
                  <div className="text-lg font-semibold">{t("category")}</div>
                  {
                    (tags["category"] ?? []).map(tag => {
                      return everySelected(tag) ?
                        <div key={tag.id}
                          className="text-sm cursor-pointer bg-primary/80 rounded-md p-1 w-full text-center text-base-100 font-semibold"
                          onClick={() => unbindTag(tag.id)}>
                          {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                        </div> :
                        <div key={tag.id}
                          className="text-sm cursor-pointer hover:bg-base-200 rounded-md p-1 w-full text-center"
                          onClick={() => changeTag(tag.id)}>
                          {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                        </div>
                    })
                  }
                </div>
                <div className="flex flex-col gap-1 w-1/3 items-center">
                  <div className="text-lg font-semibold">{t("organization")}</div>
                  {
                    (tags["organization"] ?? []).map(tag => {
                      return everySelected(tag) ?
                        <div key={tag.id}
                          className="text-sm cursor-pointer bg-primary/80 rounded-md p-1 w-full text-center text-base-100 font-semibold"
                          onClick={() => unbindTag(tag.id)}>
                          {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                        </div> :
                        <div key={tag.id}
                          className="text-sm cursor-pointer hover:bg-base-200 rounded-md p-1 w-full text-center"
                          onClick={() => changeTag(tag.id)}>
                          {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                        </div>
                    })
                  }
                </div>

                <div className="flex flex-col gap-1 w-1/3 items-center">
                  <div className="text-lg font-semibold flex flex-col items-center">{t("purpose")}</div>
                  {
                    (tags["purpose"] ?? []).map(tag => {
                      return everySelected(tag) ?
                        <div key={tag.id}
                          className="text-sm cursor-pointer bg-primary/80 rounded-md p-1 w-full text-center text-base-100 font-semibold"
                          onClick={() => unbindTag(tag.id)}>
                          {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                        </div> :
                        <div key={tag.id}
                          className="text-sm cursor-pointer hover:bg-base-200 rounded-md p-1 w-full text-center"
                          onClick={() => changeTag(tag.id)}>
                          {lang === "cht" ? tag.cht ?? tag.name : lang === "zh" ? tag.zh ?? tag.name : tag.name}
                        </div>
                    })
                  }
                </div>

                <div className="flex flex-col gap-1 w-1/3 items-center">
                  <div className="text-lg font-semibold">{t("library.level")}</div>
                  {
                    range(7, 1).map(level => (
                      checked.length &&
                        checked
                          .map(id => pictures.find(val => val.id === id)?.level === level)
                          .every(it => it) ?
                        <div key={level}
                          className="text-sm cursor-pointer bg-primary/80 rounded-md p-1 w-full text-center text-base-100 font-semibold"
                          onClick={() => changeLevel(0)}
                        >{t("level")}{level}</div> :
                        <div key={level}
                          className="text-sm cursor-pointer hover:bg-base-200 rounded-md p-1 w-full text-center"
                          onClick={() => changeLevel(level)}
                        >{t("level")}{level}</div>
                    ))
                  }
                </div>

              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}