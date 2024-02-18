//@ts-nocheck
import { useRef, useTransition } from "react";
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useOutletContext, useSearchParams } from "@remix-run/react";
import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { IdValidator, IdsValidator, PaginationWithStatusValidator, UploadValidator } from "~/utils/validators";
import { MutableRefObject, useEffect, useState } from "react";
import PictureItem from "~/components/ui/PictureItem";
import { OperatorHeader } from "~/components/layout/Header";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles, UserProps } from "~/utils/store";
import ImportPicturePanel from "~/components/ui/ImportPicturePanel";
import { FileContent } from "~/components/form/Uploader";
import { PhotoProvider } from "react-photo-view";
import UploaderDialog from "~/components/form/UploaderDialog";
import { useTranslation } from "react-i18next";
import Pagination from "~/components/ui/Pagination";

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const isPro = await hasRole(Roles.PRO, args)
  if (!isPro) throw redirect("/auth/logout")
  const url = new URL(args.request.url)
  const service = useService("picture", { user })
  const _loader = url.searchParams.get("_loader")

  switch (_loader) {
    case "private":
      return json({ code: ResultCode.OK, "pictures": await service.getPrivatePictures() })
    case "portfolio":
      return json({ code: ResultCode.OK, "pictures": await service.getPortfolioPictures() })
    case "public":
    default:
      const result = await PaginationWithStatusValidator.safeParseAsync(Object.fromEntries(url.searchParams))
      if (!result.success) {
        return json({ code: ResultCode.FORM_INVALID, pictures: [] })
      }
      let { page, status } = result.data
      page = page ?? 1
      status = status ?? -1
      return json({ code: ResultCode.OK, page: await service.getPublicPictures(page, status) })
  }
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const isPro = await hasRole(Roles.PRO, args)
  if (!isPro) throw redirect("/auth/logout")
  const form = await args.request.json()
  const { _action } = form
  const service = useService("picture", { user })
  switch (_action) {
    case "remove":
      {
        return json({})
        const result = await IdsValidator.safeParseAsync(form)
        if (!result.success) fault(ResultCode.FORM_INVALID)
        return json(await service.removePictures(result.data.ids))
      }
    case "upload":
      {
        const result = await UploadValidator.safeParseAsync(form)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.uploadPictures(result.data.contents))
      }
    case "removePicture":
      {
        // return json({})
        const result = IdValidator.safeParse(form)
        if (!result.success) fault(ResultCode.FORM_INVALID)
        return json(await service.removePrivatePicture(result.data.id))
      }
    case "removePortfolio":
      {
        const result = await IdValidator.safeParseAsync(form)
        if (!result.success) fault(ResultCode.FORM_INVALID)
        return json(await service.removePortfolioPicture(result.data.id))
      }

    case "importFromPrivate":
      {
        const result = await IdsValidator.safeParseAsync(form)
        if (!result.success) fault(ResultCode.FORM_INVALID)
        //@ts-ignore
        return json(await service.importFromPrivate(result.data.ids))
      }
  }
}

function Page () {
  const { page: { pictures, count } } = useLoaderData<typeof loader>()
  const query = useFetcher()
  const mutation = useFetcher()
  const filterRef = useRef<HTMLSelectElement>(null)
  const [images, setImages] = useState(pictures)
  const [selected, setSelected] = useState<number[]>([])
  const lastQueryPictures = useRef<unknown[]>(pictures)
  const [searchParams, setSearchParams] = useSearchParams()
  const [, startTransition] = useTransition()
  const { t } = useTranslation()

  const { reachBottomCallback } = useOutletContext<{ reachBottomCallback: MutableRefObject<() => void> }>()
  useEffect(() => {
    reachBottomCallback.current = () => {
      const ids = images.map(pic => pic.id)
      ids.sort((a, b) => b - a)
      if (query.state === "idle" && lastQueryPictures.current.length)
        query.load(`/dashboard/platform?last=${ids.pop()}&status=${searchParams.get("status") ?? "-1"}`)
    }
  }, [images])

  useEffect(() => {
    if (query.state === "idle" && query.data?.code === ResultCode.OK && query.data?.pictures) {
      lastQueryPictures.current = query.data.pictures
      setImages(prev => [...prev, ...query.data.pictures])
    }
  }, [query])

  useEffect(() => {
    setImages(pictures)
  }, [searchParams])

  const filterByStatus = () => {
    setImages([])
    // query.load("/dashboard/platform?status=" + filterRef.current?.value)
    setSearchParams({ status: filterRef.current?.value ?? "-1" })
    lastQueryPictures.current = pictures
  }

  const removePictures = (id: number = -1) => {
    const ids = id === -1 ? selected.join(",") : id.toString()
    if (ids.length)
      mutation.submit({ _action: "remove", ids }, { method: "post", encType: "application/json" })
  }

  const upload = (files: FileContent[]) => {
    mutation.submit(
      { _action: "upload", contents: files.map(d => d.src) },
      { method: "post", encType: "application/json" }
    )
  }

  useEffect(() => {
    if (mutation.state === "idle" && mutation.data?.code === ResultCode.OK) {
      setSelected([])
      setImages(pictures)
    }
  }, [mutation])

  return (
    <div className="flex flex-col gap-4">
      <OperatorHeader title={
        <Link to="/dashboard/profile/info" className="flex gap-1 items-center cursor-pointer" replace={true} prefetch="intent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
          </svg>
          {t("demand.back")}
        </Link>
      }>
        <div className="flex gap-1 items-center">
          <span className="text-sm font-bold mr-4">{selected.length}/{count}</span>
          <select className="select select-sm select-bordered w-32 max-w-xs"
            onChange={filterByStatus} ref={filterRef} defaultValue={searchParams.get("status") ?? -1}>
            <option value={-1}>All</option>
            <option value={0}>Approved</option>
            <option value={1}>Not Approved</option>
            <option value={2}>Under Review</option>
          </select>
          {/* <button className="btn btn-sm btn-error" onClick={() => removePictures(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            {t("delete")}
          </button> */}
          <button className="btn btn-sm btn-primary m-1" onClick={() => (window as any).uploaderDialog?.showModal()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {t("upload")}
          </button>

          <Link to="/dashboard/importportfolio" className="btn btn-sm btn-primary">
            {t("import")}
          </Link>
        </div>
      </OperatorHeader >

      <UploaderDialog upload={upload} allowedTypes={["image/png", "image/jpeg"]} />

      <div className="flex flex-wrap gap-6 justify-around">
        <PhotoProvider>
          {
            images.map((pic, i) => (
              <PictureItem
                selected={selected.includes(pic.id)}
                key={pic.id}
                createdAt={pic.created_at ?? ""}
                id={pic.id}
                name={pic.project_name ?? ""}
                src={pic.img_url ?? ""}
                thumbnail={pic.litpic_url ?? ""}
                owner={pic.owner as UserProps}
                tags={pic.tags}
                level={pic.level}
                select={(id, checked) => {
                  startTransition(() => {
                    (checked) ? setSelected(prev => [...prev, id]) :
                      setSelected(prev => prev.filter(p => p !== id))
                  })
                }}
              // remove={(id) => {
              //   removePictures(id)
              // }}
              />
            ))
          }
        </PhotoProvider>

        <div className="flex justify-center mt-8">
          <Pagination
            totalPages={count}
            showDirection={true}
            currentPage={+searchParams.get("page") || 1}
            linkGenerator={(page: number) => {
              const sp = new URLSearchParams(searchParams.toString())
              sp.set("page", page)
              return "/dashboard/platform?" + sp.toString()
            }}
          />
        </div>
      </div>
      <query.Form></query.Form>
      <mutation.Form></mutation.Form>
    </div >
  )
}

export default Page