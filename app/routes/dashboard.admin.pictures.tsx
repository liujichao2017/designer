import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PicturePassValidator, PictureRejectValidator } from "~/utils/validators";
import { fault, ResultCode } from "~/utils/result";
import { hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { HoveredAvatar } from "~/components/ui/Avatar";

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const pictureService = useService('picture')
  const picturePublicTagService = useService('picturePublicTag')
  const picturePublicTagList = await picturePublicTagService.getPicturePublicTagList()
  const result = await pictureService.getAuditPictureList()
  const list: {
    [key: number]: any
  } = {}
  for (let i = 0; i < result.length; i++) {
    const row = result[i]
    const user_id = row.user_id || 0
    if (!(user_id in list)) {
      list[user_id] = { user: {}, pictureList: [] }
    }
    list[user_id].user = {
      id: row.owner?.id,
      name: row.owner?.name,
      avatar: row.owner?.avatar,
      profile: row.owner?.profile
    }
    list[user_id].pictureList.push({
      id: row.id,
      litpic_url: row.litpic_url,
      tag: row.tag?.name
    })
  }
  return json({ list, picturePublicTagList })
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const pictureService = useService('picture')
  const notifyService = useService('notify')
  const { request } = args
  const formData = await request.formData()
  const _action = formData.get('_action')
  switch (_action) {
    case 'pass':
      const passResult = PicturePassValidator.safeParse(Object.fromEntries(formData))
      if (!passResult.success) return fault(ResultCode.FORM_INVALID)
      await pictureService.passPicture(passResult.data.ids ?? "", passResult.data.picturePublicTagId ?? 0, passResult.data.level)
      return json({ code: ResultCode.OK })
    case 'reject':
      const rejectResult = PictureRejectValidator.safeParse(Object.fromEntries(formData))
      if (!rejectResult.success) return fault(ResultCode.FORM_INVALID)
      await pictureService.rejectPicture(rejectResult.data.ids ?? "")
      // const notifyRejectList = await notifyService.getNotifyList(5, parseInt(rejectResult.data.userId));
      // notifyRejectList.map(async (value) => {
      //   await notifyService.deleteProNotify(value.id)
      // })
      // await notifyService.insertProNotifyContent(user.id, parseInt(rejectResult.data.userId), rejectResult.data.content, 5)
      return json({ code: ResultCode.OK })
  }
}

export default () => {
  const { list, picturePublicTagList } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [selectIds, setSelectIds] = useState([])
  const level = [0, 1, 2, 3, 4, 5, 6, 7]

  const { setValue: picturePassSetValue, register: picturePassRegister, handleSubmit: picturePassHandleSubmit } = useForm({
    resolver: zodResolver(PicturePassValidator),
    mode: 'onSubmit'
  })

  const { setValue: pictureRejectSetValue, register: pictureRejectRegister, handleSubmit: pictureRejectHandleSubmit } = useForm({
    resolver: zodResolver(PictureRejectValidator),
    mode: 'onSubmit'
  })

  const selectHandle = (index: number, i: number) => {
    const picture = list[index].pictureList[i]
    const id: number = parseInt(picture.id)
    const selectIndex = selectIds.indexOf(id)
    if (selectIndex <= -1) {
      selectIds.push(id)
    } else {
      selectIds.splice(selectIndex, 1)
    }
    setSelectIds([...selectIds])
  }

  const selectAllHandle = (index: number, checked: boolean) => {
    list[index].pictureList.forEach((value) => {
      if (checked) {
        if (!selectIds.includes(parseInt(value.id))) {
          selectIds.push(value.id)
        }
      } else {
        const selectIndex = selectIds.indexOf(value.id)
        if (selectIndex > -1) {
          selectIds.splice(selectIndex, 1)
        }
      }
    })
    setSelectIds([...selectIds])
  }

  const isAllSelect = (index: number) => {
    let selectList = []
    list[index].pictureList.forEach((value) => {
      if (selectIds.includes(parseInt(value.id))) {
        selectList.push(value.id)
      }
    })
    return selectList.length == list[index].pictureList.length
  }

  const getSelectIds = (index: number) => {
    let arr: any[] = []
    list[index].pictureList.forEach((value: {
      select: boolean;
      id: number;
    }, index: number) => {
      if (selectIds.includes(parseInt(value.id))) arr.push(value.id)
    })
    return arr.join(',')
  }

  return (<div>
    {Object.keys(list).map((value, index) => {
      return (<div className="w-full bg-base-200 rounded-md p-2.5 mt-2.5" key={index}>
        <div className="flex justify-between">
          <Link to={`/portfolio/main/${list[parseInt(value)].user.id}/project`} className="flex">
            <HoveredAvatar user={list[+value].user} size="sm" />
            <div className="ml-2.5 text-sm leading-10">{list[parseInt(value)].user.name}</div>
          </Link>
          <div className="text-sm leading-10">{list[parseInt(value)].pictureList.length} Pictures</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-10 gap-x-2.5 gap-y-2.5 pt-2.5">
          {list[parseInt(value)].pictureList.map((v, i) => {
            return (<div className={"w-full  rounded-md p-2.5 cursor-pointer border border-solid " + (selectIds.includes(parseInt(v.id)) ? 'border-blue-600' : '')} key={i} onClick={() => {
              selectHandle(parseInt(value), i)
            }}>
              <img src={v.litpic_url} className="rounded-md object-cover w-32 h-48" />
              <p className="text-sm mt-2.5">{v.tag}</p>
            </div>)
          })}
        </div>
        <div className="flex justify-between mt-2.5">
          <div className="flex items-center h-8">
            <input type="checkbox" className="checkbox-xs flex-none" checked={isAllSelect(parseInt(value))} onChange={(e) => {
              selectAllHandle(parseInt(value), e.target.checked)
            }} />
            <label className="ml-2.5 text-sm">{t('admin.picture.allSelect')}</label>
          </div>
          <div className="flex">
            <a className="text-sm border border-solid border-slate-500 leading-8 px-2.5 rounded-md cursor-pointer" onClick={() => {
              pictureRejectSetValue('ids', getSelectIds(parseInt(value)))
              pictureRejectSetValue('userId', list[parseInt(value)].user.id.toString())
              rejectModal.showModal()
            }}>{t('admin.picture.reject')}</a>
            <a className="text-sm ml-2.5 border border-solid border-slate-500 leading-8 px-2.5 rounded-md cursor-pointer" onClick={() => {
              picturePassSetValue('ids', getSelectIds(parseInt(value)))
              passModal.showModal()
            }}>{t('admin.picture.pass')}</a>
          </div>
        </div>
      </div>)
    })}

    <dialog id="passModal" className="modal">
      <div className="modal-box">
        <form onSubmit={picturePassHandleSubmit((data) => {
          fetcher.submit({ ...data }, { method: 'POST' })
          passModal.close()
        })}>
          <input type="hidden" {...picturePassRegister('ids')} />
          <input type="hidden" {...picturePassRegister('_action')} defaultValue="pass" />
          <h3 className="font-bold text-lg">{t('admin.picture.reviewPicture')}</h3>
          <div className="py-4">
            <ul>
              <li className="flex">
                <label className="w-24 leading-8">{t('admin.picture.category')}</label>
                <div className="flex-1 h-8">
                  <select className="select select-bordered w-full min-h-0 h-full" {...picturePassRegister('picturePublicTagId')}>
                    <option value="0">{t('admin.picture.default')}</option>
                    {picturePublicTagList.map((value, index) => {
                      return (<option value={value.id} key={index}>{value.name}</option>)
                    })}
                  </select>
                </div>
              </li>
              <li className="flex mt-2.5">
                <label className="w-24 leading-8">{t('admin.picture.level')}</label>
                <div className="flex-1 h-8">
                  <select className="select select-bordered w-full min-h-0 h-full" {...picturePassRegister('level')}>
                    {level.map((value, index) => {
                      return (<option value={value} key={index}>{value}</option>)
                    })}
                  </select>
                </div>
              </li>
            </ul>
          </div>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              passModal.close()
            }}>{t("cancel")}</a>
            <button className="btn btn-primary" type="submit">{t("ok")}</button>
          </div>
        </form>
      </div>
    </dialog>
    <dialog id="rejectModal" className="modal">
      <div className="modal-box">
        <form onSubmit={pictureRejectHandleSubmit((data) => {
          fetcher.submit({ ...data }, { method: 'POST' })
          rejectModal.close()
        })}>
          <input type="hidden" {...pictureRejectRegister('ids')} />
          <input type="hidden" {...pictureRejectRegister('userId')} />
          <input type="hidden" {...pictureRejectRegister('_action')} defaultValue="reject" />
          <h3 className="font-bold text-lg">{t('admin.picture.reviewPicture')}</h3>
          <div className="py-4">
            <ul>
              <li className="flex mt-2.5">
                <label className="w-24 leading-8">拒绝理由</label>
                <div className="flex-1 h-8">
                  <input type="text" className="w-full h-full input input-bordered" {...pictureRejectRegister('content')} />
                </div>
              </li>
            </ul>
          </div>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              rejectModal.close()
            }}>{t("cancel")}</a>
            <button className="btn btn-primary" type="submit">{t("ok")}</button>
          </div>
        </form>
      </div>
    </dialog>
  </div>)
}