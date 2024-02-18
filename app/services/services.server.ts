import notifyService from "./notify.server"
import projectService from "./project.server"
import profileService from "./profile.server"
import PictureService from "./picture.server"
import authService from "./auth.server"
import mailService from "./mail.server"
import demandService from "./demand.server"
import UserPictureFolderServer from "./userPictureFolder.server"
import UserPictureServer from "./userPicture.server"
import ProjectListService from "./projectList.server"
import UserServer from "./user.server"
import PrimeServer from "./prime.server"
import { redis } from "~/services/database.server"
import UserRoleServer from "~/services/userRole.server";
import RoleServer from "~/services/role.server";
import PicturePublicTagServer from "~/services/picturePublicTag.server";
import designerServer from "./designer.server"
import adminService from "./admin.server"
import incomeService from "./income.server"
import UserMessageServer from "./userMessage.server"
import projectMarkService from "./projectMark.server"
import projectListImageService from "./projectListImage.server"
import scheduledServer from "./scheduled.server"
import designerQuotationService from "./demandDesignerQuotation.server"
import { PrismaClientUnknownRequestError } from "@prisma/client/runtime/library"
import { UserProps } from "~/utils/store"

const services = {
  mail: mailService,
  notify: notifyService,
  project: projectService,
  profile: profileService,
  picture: PictureService,
  auth: authService,
  demand: demandService,
  userPictureFolder: UserPictureFolderServer,
  userPicture: UserPictureServer,
  projectList: ProjectListService,
  user: UserServer,
  prime: PrimeServer,
  role: RoleServer,
  userRole: UserRoleServer,
  picturePublicTag: PicturePublicTagServer,
  designer: designerServer,
  admin: adminService,
  income: incomeService,
  designerQuotation: designerQuotationService,
  userMessage: UserMessageServer,
  projectMark: projectMarkService,
  projectListImage: projectListImageService,
  scheduled: scheduledServer
}

const fetchPrefix = ["get", "list", "all"]

type valueOf<T> = T[keyof T]
type Options = {
  cached?: {
    expire?: number
    prefix: typeof fetchPrefix[number]
  },
}
/**
 * Generates a service based on the provided name and dependency.
 *
 * @param {T} name - The name of the service to generate.
 * @param {D} dependency - The dependency required by the service.
 * @return {ReturnType<typeof service>} The generated service.
 *
 * example:
 * const service = useService("profile", { user })
 * const profile = await service.getProfile()
 *
 */
export const useServiceExt =
  <T extends keyof typeof services, D extends Parameters<valueOf<typeof services>>[0]>
    (name: T, dependency?: Options & D) => {
    const service = services[name]
    if (!dependency)
      return service({ user: { id: 0 } }) as ReturnType<typeof service>
    else {
      if (!dependency.cached)
        return service(dependency) as ReturnType<typeof service>
      else {
        const methods = service(dependency)
        return Object.fromEntries(Object.entries(methods).map(([k, v]) => {
          if (k.startsWith(dependency.cached!.prefix)) {
            const memo = async (...args: Parameters<typeof v>) => {
              let r = await redis.get(`m::${name}::${k}::${JSON.stringify(args)}`)
              if (!r) {
                r = await v(...args)
                await redis.set(`m::${name}::${k}::${JSON.stringify(args)}`, JSON.parse(r ?? ""))
                dependency.cached?.expire && await redis.expire(`m::${name}::${k}::${JSON.stringify(args)}`, dependency.cached.expire)
                return r
              }
              return JSON.parse(r ?? "") as ReturnType<typeof v>
            }
            return [k, memo as typeof v]
          }
          return [k, v]
        })) as ReturnType<typeof service>
      }
    }
  }

export const useService =
  <T extends keyof typeof services, D extends Parameters<valueOf<typeof services>>[0]>
    (name: T, dependency?: D) => {
    const service = services[name]
    const r = !dependency ?
      service({ user: { id: 0 } }) :
      service(dependency);

    return Object.fromEntries(Object.entries(r).map(([k, v]) => {
      return [k, (...args: Parameters<typeof v>) => {
        try {
          return v(...args)
        } catch (err) {
          console.error(err)
        }
      }]
    })) as ReturnType<typeof service>
  }


export type Services = typeof services
