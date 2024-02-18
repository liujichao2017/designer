import { prisma } from "~/services/database.server";
import { ResultCode } from "~/utils/result"
import { uploadImages } from "~/utils/upload.server"
import { useService } from "~/services/services.server";
import { uploadFile } from "./aws.server";
import dayjs from "dayjs";

export default () => {
  return {
    uploadMessageImage: async (contents: string[], names: string[],
      sizes: string[], types: string[],) => {
      const images = await uploadImages(contents)
      // console.log("images", images)
      // console.log("names", names)
      // console.log("sizes", sizes)
      // console.log("types", types)
      if (!images) return { code: ResultCode.AWS_ERROR }
      // await Promise.all(images.map(({url, thumbnailUrl}) =>
      //     prisma.picture.create({
      //         data: {user_id: user.id, litpic_url: thumbnailUrl, img_url: url, status: PictureStatus.PENDING}
      //     })
      // ))
      const imageInfo = {
        fileThumbnailUrl: images[0].thumbnailUrl,
        fileUrl: images[0].url,
        fileSize: sizes[0],
        fileType: types[0],
        fileName: names[0]
      }
      return { code: ResultCode.OK, data: imageInfo, msg: 'uploadImageSuccess' }
    },

    uploadMessageFile: async (contents: string[], names: string[],
      sizes: string[], types: string[],) => {
      const files = await uploadFile(contents.join(''), names[0], types[0])
      // console.log("files", files)
      if (!files) return { code: ResultCode.AWS_ERROR }
      // await Promise.all(images.map(({url, thumbnailUrl}) =>
      //     prisma.picture.create({
      //         data: {user_id: user.id, litpic_url: thumbnailUrl, img_url: url, status: PictureStatus.PENDING}
      //     })
      // ))
      const fileInfo = {
        fileThumbnailUrl: '',
        fileUrl: files.Location,
        fileSize: sizes[0],
        fileType: types[0],
        fileName: names[0]
      }
      return { code: ResultCode.OK, data: fileInfo, msg: 'uploadFileSuccess' }
    },

    saveMessage: async (messageContent: string,
      userId: number, userRole: string, projectId: string, imageFileList: string
    ) => {
      const userInfo = await useService('user').getUser(userId)
      console.log("saveMessage", messageContent, userId, projectId)
      // console.log("userInfo", userInfo)
      await prisma.user_message.create({
        data: {
          message_content: messageContent, user_id: userId,
          user_name: userInfo?.name ?? '', user_avatar: userInfo?.avatar,
          user_role: userRole, project_id: parseInt(projectId), file_list: imageFileList,
        }
      })
      return { code: ResultCode.OK, msg: 'saveMessageSuccess' }
    },

    getMessageListByProjectId: async (projectId: number, pageIndex?: number, pageSize?: number) => {
      // console.log("getMessageListByProjectId", projectId)
      // console.log("getMessageListByProjectId-pageIndex", pageIndex)
      const list = await prisma.user_message.findMany({
        skip: (pageIndex ?? 0) * (pageSize ?? 5),//从skip开始（不包含skip）
        take: pageSize ?? 5,//取几条
        select: {
          id: true,
          message_content: true,
          created_at: true,
          user_id: true,
          user_avatar: true,
          user_role: true,
          user_name: true,
          file_list: true
        },
        where: {
          project_id: projectId
        },
        orderBy: { created_at: "desc" },
      })
      const total = await prisma.user_message.count({
        select: {
          id: true,
        },
        where: {
          project_id: projectId
        },
      })
      return { code: ResultCode.OK, data: list, total: total.id, msg: 'getMessageSuccess' }
    },

    getLatestMessageByProject: async () => {
      const groupData = await prisma.user_message.groupBy({
        _max: {
          id: true,
        },
        by: ['project_id'],
        where: {
          created_at: {
            lt: dayjs().subtract(10, 'minute').toISOString(),
          }
        }
      })
      // const list = await prisma.$queryRaw `select pca.user_id, pca.user_role, pca.project_id
      // from
      // (
      // select * ,ROW_NUMBER()  over (PARTITION by project_id order by created_at desc) as rn from user_message
      // )  pca
      // where 
      // pca.rn=1 and TIMESTAMPDIFF(MINUTE, pca.created_at, NOW()) > 10`
      return { code: ResultCode.OK, data: groupData, msg: "getEmailListSuccess" }
    }
  }
}