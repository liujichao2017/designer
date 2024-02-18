import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/cardnew"
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { EditorIcon } from "@/components/ui/Icons"
import ScoreDialog, { ValueHandler, setData } from '@/components/form/ScoreDialog'
import { t } from "i18next";
import { Label } from "~/components/ui/labelnew"
import { Button } from "@/components/ui/button"
import { Link, Outlet, useLoaderData, useLocation, useFetcher, useParams } from "@remix-run/react"
import { ActionArgs, LoaderArgs, json, redirect, defer } from "@remix-run/node"
import { useCallback, useEffect, useRef, useState } from "react";
import { EditableAvatar } from "~/components/ui/Avatar"
import { useService } from "~/services/services.server"
import { commitSession, getCurrent, getRoles, getSession } from "~/utils/sessions.server"
import { numDiv, numMulti } from "~/utils/helpers";
import { ImageDataValidator, EditProfileValidator2, IdValidator, NameValidator, ProfileDescriptionValidator } from "~/utils/validators"
import { ResultCode, fault } from "~/utils/result"
import ProfileDialog, { ValueHandler as ProfileValueHandle } from '@/components/form/ProfileDialog'
import { SkillList2 } from "~/components/ui/SkillList"
import ShareLinkDialog from "~/components/form/ShareLinkDialog"

export const loader = async (args: LoaderArgs) => {
  const user = await getCurrent(args)
  const id = args.params.id ? +args.params.id : user?.id
  if (!id) {
    throw redirect("/auth/signin")
  }
  const {
    request
  } = args
  const userAgent = request.headers.get('User-Agent') ?? '';
  const isMobile = /Mobi|Android/i.test(userAgent);

  if (isMobile) {
    if (id) {
      throw redirect(`/portfolio/${id}`)
    }
    throw redirect('/portfolio')
  }
  const roles = await getRoles(args)
  const service = useService("profile", { user })
  // return json({ profile: await service.getProfileById(id), roles })
  return defer({
    profile: await service.getProfileById(id),
    categories: await useService("picture").getCategorys(),
    roles,
    endPoint: process.env.END_CUSTOM_POINT
  })
}

export async function action (args: ActionArgs) {
  const { request } = args
  const user = await getCurrent(args)
  if (!user) {
    return redirect("/auth/signin")
  }
  // const form = await request.formData()
  const form = await args.request.json()
  // const _action = form.get("_action")
  const { _action } = form
  const service = useService("profile", { user })
  // const data = await args.request.json()
  switch (_action) {
    case "changeAvatar":
      {
        const result = await ImageDataValidator.safeParseAsync(form)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        const { code, profile } = await service.changeAvatar(result.data.content)
        if (code != ResultCode.OK) {
          return fault(code)
        }
        const session = await getSession(request.headers.get("Cookie"))
        session.set("user", JSON.stringify({ ...user, avatar: profile?.avatar }))
        return json({ code: ResultCode.OK, avatar: profile?.avatar }, { headers: { "Set-Cookie": await commitSession(session) } })
      }
    case "update":
      {

        const result = await EditProfileValidator2.safeParseAsync(form.content)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        const { code, profile } = await service.update(result.data.name, result.data.email, result.data.city, result.data.country, result.data.title, result.data.phone, result.data.account, result.data.bank, parseInt(result?.data?.language || '0', 10))
        if (code != ResultCode.OK) {
          return fault(code)
        }
        const session = await getSession(request.headers.get("Cookie"))
        const newUser = { name: profile!.name, email: profile!.email }
        session.set("user", JSON.stringify({ ...user, ...newUser }))
        return json({ code: ResultCode.OK, user: newUser }, { headers: { "Set-Cookie": await commitSession(session) } })
      }
    case "removeSkill":
      {
        const result = IdValidator.safeParse(form)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.removeSkill(result.data.id))
      }
    case "addSKill":
      {
        const result = await NameValidator.safeParseAsync(form)
        if (!result.success) {
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.addSkill(result.data.name))
      }
    case "saveDescription":
      {
        const result = await ProfileDescriptionValidator.safeParseAsync(form)
        if (!result.success) {
          console.log(result.error.format())
          return { code: ResultCode.FORM_INVALID }
        }
        return json(await service.saveDescription(result.data.description, result.data.name))
      }
  }
}


function MyWebPage () {
  const { pathname } = useLocation()
  const valueResetRef = useRef<ValueHandler>(null)
  const pValueResetRef = useRef<ProfileValueHandle>(null)
  const { profile, roles, categories, endPoint } = useLoaderData<typeof loader>()
  if (!profile) {
    return <h3>User is unexsiting</h3>
  }
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(ProfileDescriptionValidator), mode: "onChange" })
  const active = useRef("text-primary border-b-2 border-primary font-semibold p-2 text-xs")
  const normal = useRef("text-opacity-60 font-semibold p-2 text-xs")
  const fetcher = useFetcher()
  const { id } = useParams()
  const handleUploadAvatar = useCallback((data: string) => {
    fetcher.submit({ _action: "changeAvatar", content: data }, { method: "post", encType: "application/json" })
  }, [])
  const {
    demand_comment = [],
    profile: profileDetail = {},
  } = profile || {};
  const [defaultData, setDefaultData] = useState([])
  // 计算评分
  let count_5 = 0;
  let count_4 = 0;
  let count_3 = 0;
  let count_2 = 0;
  let count_1 = 0;
  const onDescSubmit = (data: any) => {
    fetcher.submit({ _action: "saveDescription", ...data }, { method: "post", encType: "application/json" })
    describeDialog?.close()
  };
  demand_comment?.forEach(ele => {
    let allStar = ele.satisfaction! + ele.design! + ele.speed! + ele.carefulness! + ele.attitude!
    allStar = numDiv(allStar, 25)
    allStar = numMulti(allStar, 5)
    // 获取评分
    if (allStar ==5) {
      count_5++
    }
    if (allStar >=4 && allStar <5) {
      count_4++
    }
    if (allStar >=3 && allStar <4) {
      count_3++
    }
    if (allStar >=2 && allStar <3){
      count_2++
    }
    if (allStar >=1 && allStar <2) {
      count_1++
    }
  });
  const sum = count_1 + count_2 + count_3 + count_4 + count_5
  const profileData = {
    phone: profileDetail?.phone,
    email: profile?.email,
    title: profileDetail?.title,
    gender: profileDetail?.gender?.toString(),
    language: profileDetail?.language?.toString(),
    city: profileDetail?.city,
    bank: profileDetail?.bank,
    account: profileDetail?.account,
  }
  return (
    <div className="bg-base">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="grid grid-cols-1 gap-4 bg-base-100 m-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex justify-center">
                    <EditableAvatar
                      user={{ avatar: profile?.avatar as string, name: profile?.name, id: profile?.id as number, email: profile?.email as string }}
                      size="xl"
                      upload={handleUploadAvatar}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h1 className="text-center">{profile?.name}</h1>
                <p className="text-center">ID:{profile?.id}</p>
                <div className="text-sm text-left overflow-hidden h-32 p-2">
                  <div className="flex justify-between">
                    {profile?.profile && profile?.profile?.description ? <div className="line-clamp-6">
                      {profile?.profile && profile?.profile?.description ? profile?.profile?.description : ''}
                    </div> : <div className="h-32 text-center w-full"> {t('userPortfolio.none')}</div>}
                    {!id &&
                      <div onClick={() => {
                        describeDialog?.showModal()
                      }} className="cursor-pointer"><EditorIcon size={4} /></div>}
                  </div>
                </div>
                <div>
                  <SkillList2
                    editable={!id}
                    skills={profile?.skills.map(val => val.skill)}
                    remove={(id: number) => {
                      fetcher.submit({ _action: "removeSkill", id }, { method: "post", encType: "application/json" })
                    }}
                    add={(name: string) => {
                      fetcher.submit({ _action: "addSKill", name }, { method: "post", encType: "application/json" })
                    }}
                    defaultSkillItems={categories.map(val => val.name)} />
                </div>
              </CardContent>
              <CardFooter className="justify-center">
                {!id && <Link to={`/portfolio/main/${profile.id}/project`}> <Button variant="outline" className="mx-2">{t('userPortfolio.preview')}</Button></Link>}
                {id && <Button variant="outline" className="mx-2" onClick={
                  _ => {
                    (window as any).shareLinkDialog.showModal();
                  }
                }>{t("share")}
                </Button>}
              </CardFooter>
            </Card>
          </div>
          {(((roles.indexOf('superAdmin') > -1 || roles.indexOf('backAdmin') > -1) && id) || !id) && <div className="grid grid-cols-1 gap-4 bg-base-100 m-4">
            <Card>
              <CardHeader>
                <CardTitle><div className="text-base">{t('userPortfolio.rating')}</div></CardTitle>
                <CardDescription>
                  {t('userPortfolio.total')}<button onClick={() => {
                    //   setDefaultData(demand_comment)
                    setTimeout(() => {
                      scoreDialog?.showModal()
                    }, 300);
                  }} className="btn btn-link">
                    {sum}
                  </button>{t('userPortfolio.comment')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-sm">
                  <div className="flex items-center"><div className="text-right w-8 inline-block mr-2">5{t('userPortfolio.star')}</div><progress className="progress" value={count_5} max={sum}></progress><div className="text-right w-12 inline-block">{`（${count_5}）`}</div></div>
                  <div className="flex items-center"><div className="text-right w-8 inline-block mr-2">4{t('userPortfolio.star')}</div><progress className="progress" value={count_4} max={sum}></progress><div className="text-right w-12 inline-block">{`（${count_4}）`}</div></div>
                  <div className="flex items-center"><div className="text-right w-8 inline-block mr-2">3{t('userPortfolio.star')}</div><progress className="progress" value={count_3} max={sum}></progress><div className="text-right w-12 inline-block">{`（${count_3}）`}</div></div>
                  <div className="flex items-center"><div className="text-right w-8 inline-block mr-2">2{t('userPortfolio.star')}</div><progress className="progress" value={count_2} max={sum}></progress><div className="text-right w-12 inline-block">{`（${count_2}）`}</div> </div>
                  <div className="flex items-center"><div className="text-right w-8 inline-block mr-2">1{t('userPortfolio.star')}</div><progress className="progress" value={count_1} max={sum}></progress><div className="text-right w-12 inline-block">{`（${count_1}）`}</div></div>
                </div>
              </CardContent>
              <CardFooter />
            </Card>
          </div>}
          <div className="grid grid-cols-1 gap-4 bg-base-100 m-4">
            <Card className="group hover:shadow-lg cursor-pointer relative">
              <CardHeader />
              {!id && <button onClick={() => {
                profileDialog?.showModal();
              }} className="hidden group-hover:block absolute top-2 right-2 p-2 btn btn-link">
                {t("userPortfolio.edit")}
              </button>}
              <CardContent>
                <CardTitle>
                  <div className="text-base"> {t("userPortfolio.base")}</div>
                </CardTitle>
                <form>
                  <div className="grid w-full items-center gap-4 pt-4">
                    {!id && <div className="space-y-1.5">
                      <Label htmlFor="name">{t("userPortfolio.phone")}：</Label>
                      <span className="overflow-hidden whitespace-nowrap overflow-ellipsis w-16 sm:w-36 xl:w-auto">{profileDetail?.phone || '--'}</span>
                    </div>}
                    <div className="space-y-1.5">
                      <Label htmlFor="gender">{t("userPortfolio.gender")}：</Label>
                      <span>{profileDetail?.gender !== undefined ? profileDetail?.gender == 0 ? t('userPortfolio.genderoptions.0') : t('userPortfolio.genderoptions.1') : '--'}</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">{t("userPortfolio.city")}：</Label>
                      <span className="overflow-hidden whitespace-nowrap overflow-ellipsis w-16 sm:w-36 xl:w-auto">{profileDetail?.city || '--'}</span>
                    </div>
                    {!id && <div className="space-y-1.5">
                      <Label htmlFor="email">{t("userPortfolio.email")}：</Label>
                      <span className="overflow-hidden whitespace-nowrap overflow-ellipsis w-16 sm:w-36 xl:w-auto">{profile?.email || '--'}</span>
                    </div>}
                    <div className="space-y-1.5">
                      <Label htmlFor="email">{t("userPortfolio.title")}：</Label>
                      <span className="overflow-hidden whitespace-nowrap overflow-ellipsis w-16 sm:w-36 xl:w-auto">{profileDetail?.title || '--'}</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">{t("userPortfolio.language")}：</Label>
                      <span>{profileDetail?.language !== undefined && profileDetail?.language !== null ? t(`userCenter.languageList.${profileDetail?.language}`) : '--'}</span>
                    </div>
                  </div>
                </form>
              </CardContent>
              {!id && <CardContent>
                <CardTitle><div className="text-base">{t("userPortfolio.bankinfo")}</div></CardTitle>
                <div className="grid w-full items-center gap-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("userPortfolio.account")}：</Label>
                    <div className="overflow-hidden whitespace-nowrap overflow-ellipsis w-16 sm:w-36 xl:w-auto">{profileDetail?.account || '--'}</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">{t("userPortfolio.bank")}：</Label>
                    <div className="overflow-hidden whitespace-nowrap overflow-ellipsis w-16 sm:w-36 xl:w-auto">{profileDetail?.bank || '--'}</div>
                  </div>
                </div>
              </CardContent>}
              <CardFooter />
            </Card>
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 justify-center lg:justify-start bg-base-100 p-4 my-4 border-solid border">
              <Link to={!id ? '/portfolio/main/project' : `/portfolio/main/${id}/project`}
                className={pathname.endsWith("project") ? active.current : normal.current}>
                {t("userPortfolio.project")}
              </Link>
              <Link to={!id ? '/portfolio/main/work' : `/portfolio/main/${id}/work`}
                className={pathname.endsWith("work") ? active.current : normal.current}>
                {t("userPortfolio.work")}
              </Link>
            </div>
          </div>
          <Outlet context={{ profile }} />
        </div>
      </div>
      <ScoreDialog ref={valueResetRef} defaultData={demand_comment.map((ele) => {
        let allStar = ele.satisfaction! + ele.design! + ele.speed! + ele.carefulness! + ele.attitude!
        allStar = numDiv(allStar, 25)
        allStar = numMulti(allStar, 5)
        return {
          ...ele,
          name: ele?.demand?.name,
          totalScore: allStar,
          satisfaction: ele.satisfaction !== undefined ? t(`satisfactionList.${ele.satisfaction - 1}`) : '--'
        }
      })} name="scoreDialog" />
      <ProfileDialog ref={pValueResetRef} data={profileData} name="profileDialog" onOk={(data) => {
        //提交数据
        fetcher.submit({ _action: "update", content: data }, { method: "post", encType: "application/json" })
        profileDialog?.close()
      }} />
      <dialog id="describeDialog" className="modal">
        <form method="dialog" className="modal-box" onSubmit={handleSubmit(onDescSubmit)}>
          <div className="py-4 form-control">
            <label className="label">{t('userPortfolio.name')}</label>
            <input type="text" {...register("name")} id="name" className={`w-full input input-bordered input-sm ${errors.name && "input-error"}`} defaultValue={profile.name} />
          </div>
          <div className="py-4 form-control">
            <label className="label">{t('"userPortfolio.desc')}</label>
            <textarea
              id="description"
              {...register("description")}
              defaultValue={profile?.profile && profile?.profile?.description ? profile?.profile?.description : ''}
              className={`textarea textarea-sm resize-none w-full h-80 ${errors.description && "textarea-error"}`}
            />
          </div>
          <div className="modal-action">
            <a className="btn" onClick={() => {
              describeDialog?.close()
            }}>{t("cancel")}</a>
            <button type="submit" className="btn btn-primary">{t("ok")}</button>
          </div>
        </form>
      </dialog>
      <ShareLinkDialog title={t("share")} link={`${endPoint}/portfolio/main/${profile.id}/project`} />
    </div>

  );
}

export default MyWebPage;
