//@ts-nocheck
import { LoaderArgs, redirect, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react"
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import Avatar from "~/components/ui/Avatar";
import { useService } from "~/services/services.server";
import { ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles, UserProps } from "~/utils/store";

export async function loader (args: LoaderArgs) {
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")

  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) throw redirect("/auth/signin")

  const { id } = args.params
  const comments = await useService("demand").getEvaluateComments(id ? +id : 0)

  return json({ code: ResultCode.OK, comments })
}
export default function Page () {
  const { comments } = useLoaderData<typeof loader>()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-16 text-sm">
      {
        comments.map(val => {
          const score = Math.floor((val.attitude + val.carefulness + val.satisfaction + val.speed) / 4)
          const images = JSON.parse(val.images ?? "[]")
          return (
            <div className="flex flex-col gap-4" key={val.id}>

              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  <Link to={`/portfolio/${val.designer?.id}`}>
                    <Avatar user={val.designer as UserProps} />
                  </Link>
                  <span>{val.designer?.name ?? ""}</span>
                </div>

                <small className="text-base-content/80">{dayjs(val.created_at).format("YYYY-MM-DD,HH:mm:ss")}</small>
              </div>

              <div className="flex gap-4">

                <div className="rating rating-sm">
                  <input type="radio" name={val.id + ""} className="mask mask-star-2 bg-orange-400" disabled={true} checked={score === 0} />
                  <input type="radio" name={val.id + ""} className="mask mask-star-2 bg-orange-400" disabled={true} checked={score === 1} />
                  <input type="radio" name={val.id + ""} className="mask mask-star-2 bg-orange-400" disabled={true} checked={score === 2} />
                  <input type="radio" name={val.id + ""} className="mask mask-star-2 bg-orange-400" disabled={true} checked={score === 3} />
                  <input type="radio" name={val.id + ""} className="mask mask-star-2 bg-orange-400" disabled={true} checked={score === 4} />

                  <span className="text-base-content/60 pl-2">5.0</span>
                </div>

                <div className="flex gap-2 text-base-content/60">
                  <span>
                    {t("demandorder.detail.comprehensiveScore")} {(score + 1) + ".0"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-wrap">
                {val.content}
              </div>

              <div className="flex flex-wrap">
                {
                  images.map(it => (
                    <img src={it} className="w-24 object-cover" key={Math.random()} />
                  ))
                }
              </div>
            </div>
          )
        })
      }
    </div>
  )
}

