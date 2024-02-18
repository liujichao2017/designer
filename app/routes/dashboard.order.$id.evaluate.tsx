
import { LoaderArgs, json, redirect, ActionArgs, AppData, SerializeFrom  } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useFetcher, useParams } from "@remix-run/react";
import { ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { EvaluateDetail } from "~/components/ui/OrderDetail";
import { useService } from "~/services/services.server";
import { numDiv, numMulti } from "~/utils/helpers";
import { CommentStatus } from '@/utils/definition';

export async function loader (args: LoaderArgs) {
    const {
        request,
        params,
    } = args;
    const user = await isAuthenticated(args)
    if (!user) throw redirect("/auth/signin")

    const isDesigner = await hasRole(Roles.PRO, args)
    if (!isDesigner) return json({ code: ResultCode.PERMISSION_DENIED, requirement: undefined })
    const {
        id
    } =  params;
    let evaluateData = {};
    if (id) {
        evaluateData = await getEvaluateComments(Number.parseInt(id, 10))
    }

    return json({ code: ResultCode.OK, evaluateData })
}
export const action = async (args: ActionArgs) => {
    const form = await args.request.json()
    const user = await isAuthenticated(args)
    if (!user) throw redirect("/auth/signin")
    switch (form._action) {
      case 'commentStatusChange': {
        const service = useService("demand");
        if (form?.demandId!== undefined && form?.status !== undefined) {
          await service.updateCommentStatus(form?.demandId, form?.status)
        }
        return json({ code: ResultCode.OK })
      }
      default: {
        return json({});
      }
    }
  }

async function getEvaluateComments(demondId: number) {
    const service = useService("demand");
    if (demondId) {
        service.updateCommentStatus(demondId, CommentStatus.STATUS_READED)
    }
    const result = await service.getEvaluateComments(demondId);
    return {
        eData: result.map((item) => {
            let allStar = item.satisfaction! + item.design! + item.speed! + item.carefulness! + item.attitude!
            allStar = numDiv(allStar, 25)
            allStar = numMulti(allStar, 5)
            return {
                ...item,
                score: allStar,
            }
        })
    }
}



export default function Page () {
    const { evaluateData, code } = useLoaderData()
    const mutation = useFetcher()
    const params = useParams();
    const scoreItems = evaluateData?.eData?.map((item: any) => {
        let images = []
        try {
            if (item.images) {
                images = JSON.parse(item.images)
            }
        }
        catch(ex){}
        return {
            score: item.score,
            content: item.content,
            images,
            created_at: item.created_at,
            designer: {
                ...item.designer
            }
        };
    })

    return (
        <EvaluateDetail scoreItems={scoreItems} />
    )
}