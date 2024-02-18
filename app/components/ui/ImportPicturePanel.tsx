import { useFetcher } from "@remix-run/react"
import { useEffect, useState, useTransition } from "react"
import { Loader } from "~/routes/api.picture"
import { ResultCode } from "~/utils/result"
import { Loading } from "./Loading"
import PictureItem from "./PictureItem"
import { useUserState } from "~/utils/store"
import { PhotoProvider } from "react-photo-view"
import { ImportStatus } from "~/services/picture.server"

type Props = {
  cancel: () => void
}

export function PrivateList ({ cancel }: Props) {
  const query = useFetcher()
  const mutation = useFetcher()
  const user = useUserState(state => state.current)
  const [selected, setSelected] = useState<number[]>([])
  const [, startTransition] = useTransition()
  useEffect(() => {
    query.load(`/dashboard/platform?_loader=private`)
  }, [])

  const importToPublic = () => {
    if (selected.length)
      mutation.submit({ _action: "importFromPrivate", ids: selected.join(",") }, { method: "post", action: "/dashboard/platform", encType: "application/json" })
  }

  const remove = (id: number) => {
    mutation.submit({ _action: "removePicture", id }, { method: "post", action: "/dashboard/platform", encType: "application/json" })
  }

  return (
    <>
      <div className="flex gap-2">
        <button className="btn btn-sm" onClick={cancel}>Cancel</button>
        <button className="btn btn-sm btn-primary" onClick={importToPublic}>Import Selected</button>
      </div>
      <div className="flex flex-wrap gap-6">
        {
          query.state === "loading" && <Loading />
        }
        <PhotoProvider>
          {
            query.state === "idle" && query.data?.code === ResultCode.OK &&
            query.data?.pictures?.map((pic: any) =>
              <PictureItem key={pic.id} {...pic}
                createdAt={pic.created_at ?? ""}
                id={pic.id}
                name={pic.project_name ?? ""}
                src={pic.img_url ?? ""}
                thumbnail={pic.litpic_url ?? ""}
                owner={user}
                selectable={pic.import_status === 0}
                selected={pic.import_status !== 0}
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
            )
          }
        </PhotoProvider>
      </div>
    </>
  )
}

export function Portfolio () {
  const query = useFetcher()
  return (
    <div>Portfolio</div>
  )
}