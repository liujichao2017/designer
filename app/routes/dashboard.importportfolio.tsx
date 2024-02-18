import { useTransition, useState } from "react";
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { PhotoProvider } from "react-photo-view";
import PictureItem from "~/components/ui/PictureItem";
import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { isAuthenticated } from "~/utils/sessions.server";
import { IdValidator, IdsValidator } from "~/utils/validators";
import { useTranslation } from "react-i18next";

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const service = useService("picture", { user })
  return json({ code: ResultCode.OK, pictures: await service.getPortfolioPictures(), user })
}

export async function action (args: ActionArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  const form = await args.request.formData()
  const _action = form.get("_action")
  const service = useService("picture", { user })
  switch (_action) {
    case "import":
      {
        const result = await IdsValidator.safeParseAsync(Object.fromEntries(form))
        if (!result.success) fault(ResultCode.FORM_INVALID)
        //@ts-ignore
        return json(await service.importFromPortfolio(result.data.ids))
      }
    case "remove":
      {
        const result = IdValidator.safeParse(Object.fromEntries(form))
        if (!result.success) fault(ResultCode.FORM_INVALID)
        //@ts-ignore
        return json(await service.removePortfolioPicture(result.data.id))
      }
  }
}

export default function Page () {
  const { pictures, user } = useLoaderData<typeof loader>()
  const [, startTransition] = useTransition()
  const mutation = useFetcher()

  const [selected, setSelected] = useState<number[]>([])

  const { t } = useTranslation()

  const importToPublic = () => {
    if (selected.length)
      mutation.submit({ _action: "import", ids: selected.join(",") }, { method: "post" })
  }

  const remove = (id: number) => {
    mutation.submit({ _action: "remove", id }, { method: "post" })
  }
  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex gap-2">
        <Link to="/dashboard/platform" className="btn btn-sm">Back</Link>
        <button className="btn btn-sm btn-primary" onClick={importToPublic}>Import Selected</button>
      </div>
      <div className="flex flex-wrap gap-6">

        <PhotoProvider>
          {
            pictures?.map((pic) =>
              <div className="flex flex-col items-center gap-3" key={pic.id}>
                <PictureItem {...pic}
                  createdAt={pic.created_at ?? ""}
                  id={pic.id}
                  name={""}
                  src={pic.img_url ?? ""}
                  thumbnail={pic.thumbnail_url ?? pic.img_url}
                  owner={user}
                  selectable={pic.import_status === 0}
                  selected={selected.includes(pic.id) || pic.import_status !== 0}
                  select={(id, checked) => {
                    startTransition(() => {
                      if (checked) {
                        setSelected(prev => [...prev, id])
                      }
                      else {
                        setSelected(prev => prev.filter(p => p !== id))
                      }
                    })
                  }}
                  remove={remove}
                />
                <span className="font-semibold text-sm">{t(`importStatus.${pic.import_status}`)}</span>
              </div>
            )
          }
        </PhotoProvider>
      </div>
    </div >
  )
}