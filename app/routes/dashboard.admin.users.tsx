//@ts-nocheck
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useService } from "~/services/services.server";
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import dayjs from "dayjs";
import { t } from "i18next";
import { commitSession, getSession, hasRole, isAuthenticated } from "~/utils/sessions.server";
import { Roles } from "~/utils/store";
import { fault, ResultCode } from "~/utils/result";
import { useEffect, useRef } from "react";
import { HoveredAvatar } from "~/components/ui/Avatar";
import Chat from "~/components/ui/chat/Chat";
import { useSocketio, ChatContext } from "~/utils/socketio";
import { useFetcherWithPromise } from "~/utils/hooks";
import { cn } from "~/lib/utils";
import Pagination from "~/components/ui/Pagination";

let lockId: number = 0
let deleteId: number = 0
let loginId: number = 0

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  const isAdmin = await hasRole(Roles.BACK_ADMIN, args)
  if (!isAdmin) {
    return fault(ResultCode.PERMISSION_DENIED)
  }
  const { request } = args
  const url = new URL(request.url)
  const page = (url.searchParams.get('page') || 1) as number
  const userService = useService('user')
  const s = url.searchParams.get("s") ?? ""
  const rs = (url.searchParams.get("rs") ?? "").split(",").map(v => +v).filter(v => v)
  const { users, pages } = await userService.getAdminList(page, s, rs)
  return json({
    userList: users, pages, code: ResultCode.OK,
    chatEndPoint: process.env.CHAT_END_POINT,
    roles: await useService("role", { user }).getRolesId(["pro", "consumer", "backAdmin"])
  })
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
  const userService = useService('user')
  const authService = useService('auth')
  const { request } = args
  const formData = await request.formData()
  const _action = formData.get('_action')
  const id = Number(formData.get('id'))
  switch (_action) {
    case 'lock':
      await userService.lockAdminUser(id, 4)
      return json({ code: ResultCode.OK })
    case 'unlock':
      await userService.lockAdminUser(id, 1)
      return json({ code: ResultCode.OK })
    case 'delete':
      await userService.deleteAdminUser(id)
      return json({ code: ResultCode.OK })
    case 'login':
      const { user } = await authService.authWithLocalById(id)
      const roles = user?.roles.map(r => r.role?.name)
      const teams = user?.teams.map(t => ({ name: t.team?.name, id: t.team?.id }))
      const session = await getSession(request.headers.get("Cookie"))
      session.set("user", JSON.stringify(user))
      session.set("roles", JSON.stringify(roles))
      session.set("teams", JSON.stringify(teams))
      return redirect("/portfolio/main/project", { headers: { "Set-Cookie": await commitSession(session) } })
  }
}

export default () => {
  const { userList, pages, chatEndPoint, code, roles } = useLoaderData<typeof loader>()
  if (code !== ResultCode.OK) {
    return <h3>{code}</h3>
  }
  const fetcher = useFetcher()

  const lockHandle = () => {
    fetcher.submit({ _action: 'lock', id: lockId }, { method: 'POST' })
    lockId = 0
    lockModal.close()
  }

  const unlockHandle = () => {
    fetcher.submit({ _action: 'unlock', id: lockId }, { method: 'POST' })
    lockId = 0
    unlockModal.close()
  }

  const deleteHandle = () => {
    fetcher.submit({ _action: 'delete', id: deleteId }, { method: 'POST' })
    deleteId = 0
    deleteModal.close()
  }

  const mutation = useFetcherWithPromise()

  const loginHandle = async () => {
    fetcher.submit({ _action: 'login', id: loginId }, { method: 'POST' })
    loginModal.close()
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const emailRef = useRef<HTMLInputElement>(null)
  const socketio = useSocketio({ endPoint: chatEndPoint })


  const rs = (searchParams.get("rs") ?? "").split(",")?.map(v => +v).filter(v => v)


  const filterByRole = (id: number) => {
    const s = new URLSearchParams(searchParams)
    if (!rs.includes(id)) rs.push(id)
    s.set("rs", rs.join(","))
    s.set("page", 1)
    setSearchParams(s)
  }

  const removeRole = (id: number) => {
    const s = new URLSearchParams(searchParams)
    s.set("rs", [...rs.filter(v => v !== id)])
    s.set("page", 1)
    setSearchParams(s)
  }

  const activeRole = (id: number) => rs.includes(id)
  const findRoleId = (name: string) => roles.find(v => v.name === name)?.id

  return (
    <ChatContext.Provider value={socketio}>
      <div className="bg-base-100 rounded-lg p-4">
        <Chat />
        <div className="flex gap-4 justify-between">
          <Link to="/dashboard/admin/createAccount" className="btn btn-sm btn-primary">{t('admin.user.createUser')}</Link>
          <form className="join" onSubmit={event => {
            event.preventDefault()
            const prefix = emailRef.current!.value
            if (!prefix) return
            const s = new URLSearchParams(searchParams)
            s.set("s", prefix)
            setSearchParams(s)
          }}>
            <input type="text" className="input input-bordered input-sm join-item w-72" placeholder="Search by name or email" ref={emailRef} />
            <button className="btn btn-sm btn-accent join-item">{t("search")}</button>
          </form>
          <div className="flex join">
            <button
              onClick={_ => {
                const id = findRoleId("pro")
                id && activeRole(id) ? removeRole(id) : filterByRole(id)
              }}
              className={cn("btn btn-sm join-item capitalize", activeRole(findRoleId("pro")) && "btn-secondary")}>Pro Designer</button>
            <button
              onClick={_ => {
                const id = findRoleId("consumer")
                id && activeRole(id) ? removeRole(id) : filterByRole(id)
              }}
              className={cn("btn btn-sm join-item capitalize", activeRole(findRoleId("consumer")) && "btn-secondary")}>Consumer</button>
            <button
              onClick={_ => {
                const id = findRoleId("backAdmin")
                id && activeRole(id) ? removeRole(id) : filterByRole(id)
              }}
              className={cn("btn btn-sm join-item capitalize", activeRole(findRoleId("backAdmin")) && "btn-secondary")}>Back Admin</button>
          </div>
        </div>
        <table className="table mt-2.5">
          <thead>
            <tr>
              <th align="center">ID</th>
              <th>{t('admin.user.email')}</th>
              <th>{t('admin.user.name')}</th>
              <th align="center">{t('admin.user.roles')}</th>
              <th align="center">{t('admin.user.login_at')}</th>
              <th align="center">{t('admin.user.status')}</th>
              <th align="center">{t('admin.user.score')}</th>
              <th align="center">{t('admin.user.primeStatus')}</th>
              <th align="center">{t('admin.user.operation')}</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((value, key) => {
              let roles: string[] = []
              value.roles.forEach((v) => {
                roles.push(v.role?.name || '')
              })
              let primeStatus = ''
              switch (value.prime?.type) {
                case 0:
                  primeStatus = 'Free'
                  break
                case 1:
                  primeStatus = 'Basic'
                  break
                case 2:
                  primeStatus = 'Advanced'
                  break
                case 3:
                  primeStatus = 'Premium'
                  break
                default:
                  primeStatus = 'Free'
                  break
              }
              const status = [
                'Unavtive',
                'Active',
                'Lock',
                'Unknown'
              ]
              return (
                <tr key={key}>
                  <td align="center">{value.id}</td>
                  <td>{value.email}</td>
                  <td>
                    <div className="flex gap-1 items-center">
                      <HoveredAvatar user={value} size="sm" />
                      <span>
                        {value.name}
                      </span>
                    </div>
                  </td>
                  <td align="center">{roles?.join(',')}</td>
                  <td align="center">{value.login_at ? dayjs(value.login_at).format('YYYY-MM-DD hh:ss:mm') : ''}</td>
                  <td align="center">{status[value.status]}</td>
                  <td align="center">{value.score || 0}</td>
                  <td align="center">{primeStatus}</td>
                  <td>
                    <div className="flex justify-center items-center">
                      <Link to={`/dashboard/admin/user_edit?id=${value.id}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Link>
                      {value.status == 4 ? (<svg xmlns="http://www.w3.org/2000/svg" onClick={() => {
                        lockId = value.id
                        unlockModal.showModal()
                      }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>) : (<svg onClick={() => {
                        lockId = value.id
                        lockModal.showModal()
                      }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="cursor-pointer w-5 h-5 ml-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>)}
                      <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {
                        loginId = value.id
                        loginModal.showModal()
                      }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="cursor-pointer w-5 h-5 ml-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {
                        deleteId = value.id
                        deleteModal.showModal()
                      }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex justify-center mt-8">
          <Pagination
            totalPages={pages}
            showDirection={true}
            currentPage={+searchParams.get("page") || 1}
            linkGenerator={(page: number) => {
              const sp = new URLSearchParams(searchParams.toString())
              sp.set("page", page)
              return "/dashboard/admin/users?" + sp.toString()
            }}
          />
        </div>

        <dialog id="lockModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('tip.title')}</h3>
            <p className="py-4">{t('tip.lock')}</p>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                lockId = 0
                lockModal?.close()
              }}>{t("cancel")}</a>
              <button className="btn btn-primary" onClick={() => {
                lockHandle()
              }}>{t("ok")}
              </button>
            </div>
          </div>
        </dialog>
        <dialog id="unlockModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('tip.title')}</h3>
            <p className="py-4">{t('tip.unlock')}</p>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                lockId = 0
                unlockModal?.close()
              }}>{t("cancel")}</a>
              <button className="btn btn-primary" onClick={() => {
                unlockHandle()
              }}>{t("ok")}
              </button>
            </div>
          </div>
        </dialog>
        <dialog id="deleteModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('tip.title')}</h3>
            <p className="py-4">{t('tip.delete')}</p>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                deleteId = 0
                deleteModal?.close()
              }}>{t("cancel")}</a>
              <button className="btn btn-primary" onClick={() => {
                deleteHandle()
              }}>{t("ok")}
              </button>
            </div>
          </div>
        </dialog>

        <dialog id="loginModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('tip.title')}</h3>
            <p className="py-4">{t('admin.user.login')}</p>
            <div className="modal-action">
              <a className="btn" onClick={() => {
                loginId = 0
                loginModal?.close()
              }}>{t("cancel")}</a>
              <button className="btn btn-primary" onClick={() => {
                loginHandle()
              }}>{t("ok")}
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </ChatContext.Provider>
  )
}