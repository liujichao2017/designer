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
// import DemandDetailNav from "~/components/ui/DemandDetailNav";
import DefaultClientAvatar from "~/images/default-client-avatar.png"
import DemoUploadFile from "~/images/demo-upload-file.png"
import DemoWordIcon from "~/images/demo-word-icon.jpg"
import { GlobalLoading, Loading } from "~/components/ui/Loading";
import UploaderDialog from "~/components/form/UploaderDialog";
import { FileContent } from "~/components/form/Uploader";
import dayjs from 'dayjs';
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";

type Props = {
  userId: number,
  projectId: number,
  messageList: any[],
  messageTotal: number,
  totalPageNum: number,
  currentPageIndex: number,
  imageFileList: any[],
  userRole: string,
  loadingFlag: boolean,
  sendMessage: (
    messageContent: string, 
    imageFileList: any[],
    userId: number, 
    userRole: string, 
    projectId: number) => void,
  upload: (files: FileContent[]) => void,
  toNextPageAction: () => void
}

export default function MessageBoard({userId , projectId, messageList, messageTotal, totalPageNum, currentPageIndex, imageFileList, userRole, loadingFlag, upload, sendMessage, toNextPageAction}: Props){

  const { t } = useTranslation()
  const { toast } = useToast();
  // let loadingFlag = useRef<boolean>(false)
  // let currentPageIndex = useRef<number>(0)
  // let totalPageNum = useRef<number>(0 )
  // console.log("totalPageNum", totalPageNum)
  // const [messageList, setMessageList] = useState([])

  // useEffect(() => {
  //   // if(messageData.length > 0 ){
  //   //   // console.log("messageData", messageData)
  //   //   if(messageList.length == 0){
  //   //     setMessageList([].concat(messageData))
  //   //   }
  //   //   else{
  //   //     setMessageList(messageList.concat(messageData))
  //   //   }
  //   // }
  //   totalPageNum.current = (messageTotal % 5 == 0) ? (messageTotal / 5) : (Math.ceil(messageTotal / 5))
  //   loadingFlag.current = false
  // },[messageData])

  const [messageContent, setMessageContent] = useState('')

  // const [imageFileList, setImageFileList] = useState([])
  // const sendMessage = () => {
  //   // console.log("demandDetail", demandDetail)
  //   if(messageContent.trim().length < 10){
  //     toast({
  //       title: t('demandorder.detail.prompt'),
  //       description: t('demandorder.detail.messagePromptDescription')
  //     })
  //     return
  //   }
  //   if(loadingFlag.current){
  //     return
  //   }

  //   loadingFlag.current = true
  //   mutation.submit(
  //     { _action: "submitMessage", messageContent: messageContent, 
  //     imageFileList: JSON.stringify(imageFileList), userId: user.id, userRole: 'designer', projectId: projectId,
  //     },
  //     { method: "post", encType: "application/json" }
  //   )
  // }

  // const navigate = useNavigate()
  // const upload = (files: FileContent[]) => {
  //   console.log("files",files )
  //   if(loadingFlag.current){
  //     return
  //   }
  //   loadingFlag.current = true
  //   mutation.submit(
  //     { _action: "upload", contents: files.map(d => d.src),names: files.map(d => d.name),
  //       sizes: files.map(d => d.size) , types: files.map(d => d.type)  },
  //     { method: "post", encType: "application/json" }
  //   )
  // }

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
    // if(loadingFlag.current){
    //   return
    // }
    // if(totalPageNum == (currentPageIndex + 1)){
    //   return
    // }
    // loadingFlag.current = true

    toNextPageAction();

    // loadingFlag.current = false
  }

  const handleScroll = (e: Event) => {
      
    const scrollHeight = document.getElementById('messgeContainer')?.scrollHeight
    const clientHeight = document.getElementById('messgeContainer')?.clientHeight
    const scrollTop = document.getElementById('messgeContainer')?.scrollTop
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

  return (<div className="pb-[6.75rem]">
    <div className="bg-white rounded-lg p-5 h-[60vh] overflow-y-auto" id="messgeContainer">
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
                    if(loadingFlag){
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
              
              
              <div className="cursor-pointer bg-[#2F4CDD] w-24 h-7 flex justify-center rounded" onClick={()=>{
                sendMessage(messageContent, imageFileList,
                userId, userRole, projectId
                );
                setMessageContent('');
              }}>
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
          
          { totalPageNum == (currentPageIndex + 1) ? (
            <div className="font-bold text-sm mt-5 text-center">{t('demandorder.detail.messageAllLoaded')}</div>
          ) : ''}
        </div>
        
      
      
  </div>)


}