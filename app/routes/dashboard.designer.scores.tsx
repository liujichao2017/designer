import { useLoaderData, useNavigate } from "@remix-run/react";
import { EvaluateDetail } from "~/components/ui/OrderDetail";
import { isAuthenticated } from "~/utils/sessions.server";
import { ActionArgs, AppData, json, LoaderArgs, redirect, SerializeFrom } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { numDiv, numMulti } from "~/utils/helpers";


export async function loader (args: LoaderArgs) {
  const {
      request,
      params,
  } = args;
  const { searchParams } = new URL(request.url)
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  return await getEvaluateComments(user.id) 
}


async function getEvaluateComments(userId: number) {
  const service = useService("designer");
  const result = await service.getSelfEvaluateComments(userId);
  let totalScore = 0;
  const scoreItems = [
    ...result.map((item) => {
      let allStar = item.satisfaction! + item.design! + item.speed! + item.carefulness! + item.attitude!
      allStar = numDiv(allStar, 25)
      allStar = numMulti(allStar, 5)
      totalScore+= allStar;
      return {
          ...item,
          score: allStar,
      }
    })
  ]
  return json({
    totalScore: result.length > 0 ? Math.ceil(totalScore/result.length) : 0,
    scoreItems,
  })
}

export default function Page () {
  const loadData = useLoaderData<typeof loader>();
  const scoreItems = loadData?.scoreItems?.map((item: any) => {
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
    <EvaluateDetail scoreItems={scoreItems} type="self" totalScore={loadData?.totalScore}/>
  )
}