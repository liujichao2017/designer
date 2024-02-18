import { Link, useParams, useLocation, Outlet , useSearchParams, 
  useOutletContext, useFetcher, useLoaderData, useNavigate} from "@remix-run/react";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { isAuthenticated } from "~/utils/sessions.server";
import { ChangeDemandValidator, IdValidator, UploadValidator } from "~/utils/validators";
import { PhotoProvider, PhotoView } from "react-photo-view"
import PictureItem from "~/components/ui/PictureItem";
import { t } from "i18next";
import { fault, ResultCode } from "~/utils/result";
import { useEffect, useRef, useState } from "react";
import { useService } from "~/services/services.server";
import DemandDetailStatus from "~/components/ui/DemandDetailStatus";
// import DemandDetailNav from "~/components/ui/DemandDetailNav";
import DefaultClientAvatar from "~/images/default-client-avatar.png"
import DefaultDesignerAvatar from "~/images/default-designer-avatar.png"
import DemoUploadFile from "~/images/demo-upload-file.png"
import DemoWordIcon from "~/images/demo-word-icon.jpg"
import { GlobalLoading, Loading } from "~/components/ui/Loading";
import UploaderDialog from "~/components/form/UploaderDialog";
import { FileContent } from "~/components/form/Uploader";
import { time } from "console";
import dayjs from 'dayjs';
import { useToast } from "~/components/ui/use-toast";
import { Form } from "react-hook-form";
import { current } from "immer";
import { handle } from "~/root";
import { useTranslation } from "react-i18next";
export async function loader (args: LoaderArgs) {

  const {
    request,
    params,
  } = args;
  const user = await isAuthenticated(args)
  if (!user) throw redirect("/auth/signin")
  // console.log('request params', params)
  const {
    id
  } =  params;
  // console.log('request params id', id)

  const url = new URL(request.url)
  // console.log('request params id', url.searchParams)
  const pageIndex = url.searchParams.get('pageIndex') ?? '0'
  // console.log('request params pageIndex', pageIndex)
  // const result = IdValidator.safeParse(Object.fromEntries(url.searchParams))
  // if (!result.success) {
  //   console.log('result.success', result.success)
  //   return fault(ResultCode.FORM_INVALID)
  // }
  // const demandService = useService('demand')
  // const demandDetail = await demandService.getDemand(result.data.id)
  // console.log('demandDetail', demandDetail)
  const messageListRes = await useService('userMessage').getMessageListByProjectId(parseInt(id ?? '0'), parseInt(pageIndex))
  // console.log('messageListRes', messageListRes)
  return json({ user, projectId: id, messageData: messageListRes.data, messageTotal: messageListRes.total, code: ResultCode.OK,  link: process.env.SHARE_URL })
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
      return json(await service.saveMessage(form.messageContent, form.userId, form.userRole,
        form.projectId, form.imageFileList,
         ))
    }
    default:{
      return json({})
    }
  }
}

export default function Page () {
  const {  user, messageData, messageTotal, projectId } = useLoaderData()
  // console.log("projectId", projectId)
  // console.log("messageData", messageData)
  // console.log("messageTotal", messageTotal)
  // const { isMobile }:  any = useOutletContext();
  const fetcher = useFetcher()
  const { t } = useTranslation()
    // const [demandDetail, setDemandDetail] = useState(demandDetailRow)
  const handleBegin = (id: number, toUser: number) => {
    fetcher.submit({ _action: "tobeBegin", id, status: 2000, designer_user_id: null, to: toUser }, { method: "post" })
  }
  const { toast } = useToast();
  let loadingFlag = useRef<boolean>(false)
  let currentPageIndex = useRef<number>(0)
  let totalPageNum = useRef<number>(0 )
  // console.log("totalPageNum", totalPageNum)
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

  const [messageContent, setMessageContent] = useState('')

  const mutation = useFetcher()
  const [imageFileList, setImageFileList] = useState([])
  const sendMessage = () => {
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
      imageFileList: JSON.stringify(imageFileList), userId: user.id, userRole: 'designer', projectId: projectId,
      },
      { method: "post", encType: "application/json" }
    )
  }
  const navigate = useNavigate()
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

  const transferDateTime = (time: Date) => {
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
  }

  const transferFileSizeNum = (size: number) => {
    if (size < 1000){
      return size + "B"
    }
    else if (size < 1000000){
      return size / 1000 + "KB"
    }
    else{
      return size / 1000000 + "MB"
    }
  }

  const toNextPage = () => {
    // debugger
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

  const handleScroll = (e: Event) => {
      
    const scrollHeight = document.getElementById('messgeContainer')?.scrollHeight
    const clientHeight = document.getElementById('messgeContainer')?.clientHeight
    const scrollTop = document.getElementById('messgeContainer')?.scrollTop
    // const offsetHeight = document.getElementById('messgeContainer')?.offsetHeight
    // const distince = (scrollHeight ?? 0) -  (scrollTop ?? 0)
    // console.log("scrollTop", document.getElementById('messgeContainer')?.scrollTop)
    // console.log("messgeContainer-clientHeight", clientHeight)
    // console.log("messgeContainer-scrollTop", scrollTop)
    // console.log("messgeContainer-scrollHeight", scrollHeight)
    // const msgOffsetTop = document.getElementById('messageTip')?.offsetTop
    // console.log("messageTip-offsetTop", msgOffsetTop)
    if(scrollHeight && clientHeight && scrollTop && (scrollHeight - clientHeight - scrollTop < 50) ){
      // console.log("reload")
      toNextPage()
    }

  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true)
    // window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      // window.addEventListener('wheel', handleWheel)
    }
  })

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
      setMessageContent('')
      setImageFileList([])
      currentPageIndex.current = 0
      setMessageList([])
      navigate("")
    }
    // if (mutation.state === "idle" && mutation.data && mutation.data?.code === ResultCode.OK && mutation.data.msg == 'getMessageSuccess') {
      // console.log("getMessageSuccess", mutation.data)
      // const messageList = mutation.data.data
      // console.log("messageList", messageList)
      // setPageIndex(pageIndex+1)
      // let temp = [...imageFileList]
      // temp.push({thumbnailUrl: imageInfo.thumbnailUrl, url: imageInfo.url})
      // console.log("imageFileList", imageFileList)
      // setImageFileList(temp)
    // }
    loadingFlag.current = false
  }, [mutation])

  
  return (<div className="pb-[6.75rem]">
    {/* <DemandDetailStatus demandDetail={demandDetail} afterSales={true} onBegin={handleBegin} className={isMobile ? 'text-xs' : ''}/> */}
    {/* <DemandDetailNav demandDetail={demandDetail} showHis={!isMobile} className={isMobile ? 'text-xs' : ''} type={1} handle={() => {
        changeIsHistory(true)
    }}/> */}
    <div className="bg-white rounded-lg p-5 h-[60vh] overflow-y-auto" id="messgeContainer">
      {/* <div className="flex w-full h-[50vh] justify-center items-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div> */}
      
          <div className="flex align-start">
          <div className="w-6 md:w-12">
            <img src={DefaultClientAvatar} className="w-6 md:w-12 h-6 md:h-12 rounded-full"></img>
          </div>
          {/* leave message start */}
          <div className="flex flex-col ml-5 w-full">
            <textarea className="textarea textarea-bordered textarea-xl w-full h-32" 
            value={messageContent} placeholder={t('demandorder.detail.messageTip')}
             onChange={(e) => { setMessageContent(e.target.value) }}></textarea>
            <div className="flex justify-between mt-5">
              <div className="flex flex-col">
                <div className="cursor-pointer w-24 h-7 border flex justify-center rounded mb-2.5">
                  <span className="text-[#868686] text-sm leading-7" onClick={() => {
                    if(loadingFlag.current){
                      // toast({
                      //   title: t('prompt'),
                      //   description: '数据处理中，请稍等'
                      // })
                      return
                    }
                    
                    if(imageFileList.length >=5){
                      toast({
                        title: t('demandorder.detail.prompt'),
                        description: t('demandorder.detail.messageUploadFileCountLimit')
                      })
                      return
                    }
                    (window as any).uploaderDialog?.showModal()
                    }}>+ {t('demandorder.detail.uploadFile')} </span>
                </div>
                {
                  imageFileList.length > 0 ? (
                    <div className="flex flex-col">
                      {imageFileList.map((fileItem, index) => {
                        if (fileItem.fileType == 'image/png' || fileItem.fileType == 'image/jpeg') {
                          return (
                            <div key={index} className="flex content-center mt-2.5">
                              <PhotoProvider>
                                <PhotoView src={fileItem.fileUrl}>
                                  <img src={fileItem.fileThumbnailUrl} className="w-14 h-14 cursor-pointer rounded"></img>
                                </PhotoView>  
                              </PhotoProvider>
                              {/* <img src={fileItem.fileThumbnailUrl} className="w-14 h-14 rounded cursor-pointer"></img> */}
                              <span className=" text-[#222222] ml-2">{fileItem.fileName}</span>
                              <span className=" text-[#9C9DA5] ml-2">{transferFileSizeNum(fileItem.fileSize)}</span>
                            </div>
                          )
                        }
                        else{
                          return (
                            <div key={index} className="flex items-center mt-2.5 ">
                              {/* <span className="text-sm text-[#86868B]">· 附件</span> */}
                              <img src={DemoWordIcon} className="w-4 h-4 ml-2"></img>
                              <a href={fileItem.fileUrl} target="_blank" className=" text-[#222222] ml-2">{fileItem.fileName}</a>
                              <span className=" text-[#9C9DA5] ml-2">{transferFileSizeNum(fileItem.fileSize)}</span>
                            </div>
                          )
                        }
                          
                        })
                      }
                    </div>
                  ) : ''
                }
              </div>
              
              
              <div className="cursor-pointer bg-[#2F4CDD] w-24 h-7 flex justify-center rounded" onClick={sendMessage}>
                <span className="text-white text-sm leading-7">{t('demandorder.detail.leaveMessage')} </span>
              </div>
            </div>
          </div>
          {/* leave message end  */}
        </div>

        {/* message show start */}

        {
          messageList.map((item ,index) => {
            return (
              <div key={index} className="flex align-start mt-10">
                <div className="w-6 md:w-12">
                  <img src={item.user_avatar } className="w-6 md:w-12 h-6 md:h-12 rounded-full"></img>
                </div>
                <div className="flex flex-col ml-5 w-full text-sm">
                  <div className="flex">
                    <span className="text-[#222222] font-semibold">{item.user_name}</span>
                    <div className="bg-[#D2D8FC] rounded h-5 ml-2 flex justify-center">
                      <span className="text-[#2A387E] text-xs leading-5 px-2">{ item.user_role == 'client' ? t('demandorder.detail.client') : 
                        (item.user_role == 'designer' ? t('designer') : t('demandorder.detail.backAdmin') ) }</span>
                    </div>
                    
                    <span className="text-xs text-[#86868B] leading-5 ml-2">· {transferDateTime(item.created_at)}</span>
                  </div>
                  <p className="text-black mt-2.5">{item.message_content}</p>
                  { item.file_list && item.file_list.length > 0 ? (
                    <div className="flex flex-col mt-2.5">
                      {
                        JSON.parse(item.file_list).map((fileItem, fileIndex) => {
                          if(fileItem.fileType == "image/png" || fileItem.fileType == "image/jpeg") {
                            return (
                              <div key={fileIndex} className="mt-2.5 flex items-center">
                                <div className="border-[#E5E6EB]  border-[1px] border-box">
                                  <PhotoProvider>
                                    <PhotoView key={fileIndex} src={fileItem.fileUrl}>
                                      <img src={fileItem.fileThumbnailUrl} className="w-14 h-14 cursor-pointer rounded"></img>
                                    </PhotoView>  
                                  </PhotoProvider>
                                </div>
                                <span className=" text-[#222222] ml-2">{fileItem.fileName}</span>
                                <span className=" text-[#9C9DA5] ml-2">{transferFileSizeNum(fileItem.fileSize)}</span>
                              </div>
                            )
                          }
                          else{
                            return (
                              <div key={fileIndex} className="flex ml-2 mt-2.5 items-center">
                                {/* <span className="text-sm text-[#86868B]">· 附件</span> */}
                                <img src={DemoWordIcon} className="w-4 h-4 ml-2"></img>
                                <a href={fileItem.fileUrl} target="_blank" className="text-[#222222] ml-2">{fileItem.fileName}</a>
                                <span className=" text-[#9C9DA5] ml-2">{transferFileSizeNum(fileItem.fileSize)}</span>
                              </div>
                            )
                            
                          }
                        })
                      }  
                    </div>
                  ) : '' }
                  
                </div>
                
              </div>
            )
          })
        }
        {/* message show end */}


        <UploaderDialog upload={upload} allowedTypes={["image/png", "image/jpeg","application/pdf", 
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel"]} multiple={false} maxItemCount={1} maxItemSize={1024 * 1024 * 5} />
          
          { totalPageNum.current == (currentPageIndex.current + 1) ? (
            <div className="font-bold text-sm mt-5 text-center">{t('demandorder.detail.messageAllLoaded')}</div>
          ) : ''}
          {/* <span>totalPageNum: {totalPageNum.current}</span>
          <span>currentPageIndex.current + 1: {currentPageIndex.current + 1}</span> */}
        </div>
        
      
      {/* <div className="flex w-full h-[50vh] justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div> */}
        {/* <div className="flex justify-between items-center">
            <div className="font-medium">{t('demandorder.subtitle')}</div>
        </div> */}
        


        
         
          {/* <div className="font-bold text-sm mt-5 text-center cursor-pointer" onClick={toNextPage}>加载更多</div> */}
          
    
  </div>)
}