//@ts-nocheck
import { LoaderArgs, json, redirect, ActionArgs, AppData, SerializeFrom } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { RequirmentDetialNew } from "~/components/ui/OrderDetail";
import { useService } from "~/services/services.server";
import { ContentValidator } from "~/utils/validators";


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
    } = params;
    let requirement = {};
    if (id) {
        const pictureService = useService('picture')
        requirement = await getRequirment(Number.parseInt(id, 10))
        requirement.pictureList = requirement.picture_id ? await pictureService.getPictureListByIds(requirement.picture_id) : []
        requirement.selectedImages = requirement.pictureList
    }

    return json({ code: ResultCode.OK, requirement })
}

export async function action (args: ActionArgs) {
    const user = await isAuthenticated(args)
    if (!user) {
        throw redirect("/auth/signin")
    }
    const { _action, ...form } = await args.request.json()
    switch (_action) {
        case "addDesignerAddition":
            {
                const result = ContentValidator.safeParse(form)
                if (!result.success) return fault(ResultCode.FORM_INVALID)
                const nd = await useService("demand", { user }).addDesignerAddition(result.data.id, result.data.content)
                return json({ code: ResultCode.OK })
            }
    }
}


async function getRequirment (demondId: number) {
    if (!demondId) {
        return json({})
    }
    const service = useService("demand");
    const pservice = useService("picture");
    const result = await service.getDemandAttachments(demondId);
    const picture = await pservice.getPictureListByIds(`${result?.picture_id}` || '[]');
    return {
        ...result,
        pictures: picture.map((item) => item.litpic_url),
    }
}

function buildDataStructure (loadData: SerializeFrom<AppData>) {
    const {
        type,
        status,
        name,
        order_price,
        img_list,
    } = loadData;

    const statusData = {
        type,
        status,
        name,
        avatarUrl: '',
    }
    let imglist = [];
    try {
        imglist = JSON.parse(img_list)
    } catch (e) {
        imglist = []
    }

    const reqData = {
        ...loadData,
        img_list: imglist,
    }

    const payData = {
        order_price,
        pay_type: ''
    }
    return {
        statusData,
        reqData,
        payData,
    }

}

export default function Page () {
    const { requirement, code } = useLoaderData()
    const {
        reqData
    } = buildDataStructure(requirement)

    const fetcher = useFetcher()

    const addAddition = (content: string) => {
        fetcher.submit(
            { _action: "addDesignerAddition", id: requirement.id, content },
            { method: "post", encType: "application/json" }
        )
    }
    return (
        <RequirmentDetialNew demandDetail={reqData} addAddition={addAddition} />
    )
}