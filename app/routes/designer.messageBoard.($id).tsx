import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";

import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import MessageBoard from "~/components/ui/demand/MessageBoard"
import { useService } from "~/services/services.server";
import { ResultCode, fault } from "~/utils/result";
import { isAuthenticated } from "~/utils/sessions.server";
import { UploadValidator } from "~/utils/validators";
import { FileContent } from "~/components/form/Uploader";
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";

export async function loader (args: LoaderArgs) {
  
  const {
    request,
    params,
  } = args;

  const user = await isAuthenticated(args)
  
  const { searchParams } = new URL(request.url)
  console.log("searchParams", searchParams.get('id'))

  if (!user) throw redirect("/auth/signin")
  let designerId = null
  if(params.id){
    designerId = params.id
  }
  else{
    designerId = user.id
  }
  console.log("params", params.id)
  const projectId = 1061
  const url = new URL(request.url)
  // console.log('request params id', url.searchParams)
  const pageIndex = url.searchParams.get('pageIndex') ?? '0'
  const messageListRes = await useService('userMessage').getMessageListByProjectId( parseInt(projectId + ''), parseInt(pageIndex))
  return json({designerId, projectId, messageData: messageListRes.data, messageTotal: messageListRes.total })
}

export const action = async (args: ActionArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
      throw redirect("/auth/signin")
  }
  const form = await args.request.json()
  const { _action } = form
  // console.log("form", form)
  
  const service = useService("userMessage")
  switch (_action) {
    case "upload":
    {
      
      const fileType = form.types[0]
      if(fileType == "image/png" || fileType == "image/jpeg"){
        const result = await UploadValidator.safeParseAsync(form)
        // console.log("UploadValidator", result)
        if (!result.success) {
          return fault(ResultCode.FORM_INVALID)
        }
        return json(await service.uploadMessageImage(result.data.contents, form.names,
          form.sizes, form.types ))
      }
      else{
        return json(await service.uploadMessageFile(form.contents, form.names,
          form.sizes, form.types ))
      }
      // return json({})
    }
    case "submitMessage":
    {
      // const result = await UploadValidator.safeParseAsync(form)
      // console.log("UploadValidator", result)
      // if (!result.success) {
      //   return fault(ResultCode.FORM_INVALID)
      // }
      return json(await service.saveMessage(form.messageContent, parseInt(form.userId), form.userRole,
       form.projectId, form.imageFileList,
         ))
    }
    default:{
      return json({})
    }
  }
}

export default function Page () {
  const {  designerId, projectId, messageData, messageTotal, } = useLoaderData()
  const { t } = useTranslation()
  const { toast } = useToast();
  console.log("messageData",messageData)
  const mutation = useFetcher()
  let loadingFlag = useRef<boolean>(false)
  const [imageFileList, setImageFileList] = useState([])
  // const [messageContent, setMessageContent] = useState('')
  const navigate = useNavigate()
  let currentPageIndex = useRef<number>(0)
  let totalPageNum = useRef<number>(0 )
  const [messageList, setMessageList] = useState([])

  useEffect(() => {
    if(messageData.length > 0 ){
      // console.log("messageData", messageData)
      if(messageList.length == 0){
        setMessageList([].concat(messageData))
      }
      else{
        setMessageList(messageList.concat(messageData))
      }
    }
    totalPageNum.current = (messageTotal % 5 == 0) ? (messageTotal / 5) : (Math.ceil(messageTotal / 5))
    loadingFlag.current = false
  },[messageData])

  useEffect(() => {
    if (mutation.state === "idle" && mutation.data && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'uploadImageSuccess') {
      console.log("uploadImageSuccess", mutation.data)
      const imageInfo = mutation.data.data
      console.log("imageInfo", imageInfo)
      let temp = [...imageFileList]
      temp.push({ fileType: imageInfo.fileType, fileThumbnailUrl: imageInfo.fileThumbnailUrl, 
        fileName: imageInfo.fileName, fileUrl: imageInfo.fileUrl ,fileSize: imageInfo.fileSize})
      // console.log("imageFileList", imageFileList)
      setImageFileList(temp)
    }
    if (mutation.state === "idle" && mutation.data && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'uploadFileSuccess') {
      console.log("uploadFileSuccess", mutation.data)
      const fileInfo = mutation.data.data
      console.log("fileInfo", fileInfo)
      let temp = [...imageFileList]
      temp.push({ fileType: fileInfo.fileType, fileThumbnailUrl: fileInfo.fileThumbnailUrl, 
        fileName: fileInfo.fileName, fileUrl: fileInfo.fileUrl ,fileSize: fileInfo.fileSize})
      // console.log("imageFileList", imageFileList)
      setImageFileList(temp)
    }
    if (mutation.state === "idle" && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'saveMessageSuccess') {
      console.log("saveMessageSuccess", mutation.data)
      // setMessageContent('')
      setImageFileList([])
      currentPageIndex.current = 0
      setMessageList([])
      navigate("")
    }

    loadingFlag.current = false
  }, [mutation])
  
  const sendMessage = (messageContent: string, 
    imageFileList: any[],
    userId: number, 
    userRole: string, 
    projectId: number ) => {
    // console.log("demandDetail", demandDetail)
    if(messageContent.trim().length < 10){
      toast({
        title: t('demandorder.detail.prompt'),
        description: t('demandorder.detail.messagePromptDescription')
      })
      return
    }
    if(loadingFlag.current){
      return
    }

    loadingFlag.current = true
    mutation.submit(
      { _action: "submitMessage", messageContent: messageContent, 
      imageFileList: JSON.stringify(imageFileList), userId, userRole, projectId,
      },
      { method: "post", encType: "application/json" }
    )
  }

  const upload = (files: FileContent[]) => {
    console.log("files",files )
    if(loadingFlag.current){
      return
    }
    loadingFlag.current = true
    mutation.submit(
      { _action: "upload", contents: files.map(d => d.src),names: files.map(d => d.name),
        sizes: files.map(d => d.size) , types: files.map(d => d.type)  },
      { method: "post", encType: "application/json" }
    )
  }

  const toNextPage = () =>{
    if(loadingFlag.current){
      return
    }
    if(totalPageNum.current == (currentPageIndex.current + 1)){
      return
    }
    loadingFlag.current = true

    currentPageIndex.current = currentPageIndex.current + 1
    
    // console.log("currentPageIndex.current", currentPageIndex.current)
    if(currentPageIndex.current > totalPageNum.current){
      currentPageIndex.current = totalPageNum.current
      return
    }
    navigate("?pageIndex=" + (currentPageIndex.current) )
  }

  const userRole = "designer"
  
  return (
    <div className="flex flex-col gap-6 bg-base-200/50 rounded-2xl p-10">
      <MessageBoard 
        userId={designerId} 
        projectId={projectId}
        messageList={messageList} 
        messageTotal={messageTotal}
        totalPageNum={totalPageNum.current}
        currentPageIndex={currentPageIndex.current}
        userRole={userRole}
        imageFileList={imageFileList}
        sendMessage={sendMessage}
        upload={upload}
        loadingFlag={loadingFlag.current}
        toNextPageAction={toNextPage} />
    </div>
  )
}