
import { useService } from "~/services/services.server"
import { LoaderArgs, defer, json, redirect } from "@remix-run/node";
import { ResultCode, fault } from "~/utils/result"

export const loader = async (args: LoaderArgs) => {
  const {
    request,
    params,
  } = args;
  const {
    method
  } = params
  const service = useService('scheduled');
  try {
    switch (method) {
      case 'batchSend12NotbeginMail':
        await service.batchSend12NotbeginMail();
        break;
      case 'batchLeft2NotAcceptMail':
        await service.batchLeft2NotAcceptMail();
        break;
      case 'batchNotAccepttoUnacceptMail':
        await service.batchNotAccepttoUnacceptMail();
        break;
      case 'batchSend48NotFinishedMail':
        await service.batchSend48NotFinishedMail();
        break;
      case 'batchSend48NotFinalyFinishedMail':
        await service.batchSend48NotFinalyFinishedMail();
        break;
      case 'batchSendEmailToUnreadMessageClientOrDesigner':
        await service.sendEmailToUnreadMessageClientOrDesigner();
        break;
      default:
        break;
    }
    return json({ code: ResultCode.OK, })
  } catch (e) {
    console.error(e)
    return fault(ResultCode.EXCEPTION)
  }
}
