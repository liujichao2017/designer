import { useService } from "~/services/services.server";
import { LoaderArgs, redirect, json } from "@remix-run/node";
import { ResultCode } from "~/utils/result";
import { isAuthenticated } from "~/utils/sessions.server";
import { useCallback, useEffect, useRef, useState, useContext } from "react"
import { bool } from "aws-sdk/clients/signer";
import DefaultCustomerAvatar from "~/images/default-customer-avatar.png";
import DefaultServiceAvatar from "~/images/default-service-avatar.png";
import ServiceFile from "~/images/service-file.png";
import ServiceSend from "~/images/service-send.png";
import { t } from "i18next";
import { useToast } from "~/components/ui/use-toast";
import { ChatContext } from "~/utils/socketio"
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";

export const loader = async (args: LoaderArgs) => {
  const user = await isAuthenticated(args)
  if (!user) {
    throw redirect("/auth/signin")
  }
  return json({ user, code: ResultCode.OK })
}

export default () => {
  const [showModal,setShowModal] = useState<boolean>(true)
  const [messageContent, setMessageContent] = useState('')
  const [searchContent, setSearchContent] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { toast } = useToast();
  const { user, } = useLoaderData<typeof loader>()
  const {
    roomMessages,
    connected,
    currentRoom,
    changeRoom,
    login,
    send,
    open,
    setOpen,
    userCache,
    roomCache
  } = useContext(ChatContext)

  const [messageList, setMessageList] = useState([
    {
      "role": "customer",
      "msgType": "text",
      "msgContent": "想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题",
    },
    {
      "role": "customer",
      "msgType": "text",
      "msgContent": "想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题",
    },
    {
      "role": "service",
      "msgType": "text",
      "msgContent": "欢迎光临，请问想了解什么问题想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题",
    },
    {
      "role": "service",
      "msgType": "text",
      "msgContent": "欢迎光临，请问想了解什么问题想咨询你几个问题想咨询你几个问题想咨询你几个问题想咨询你几个问题",
    }
  ])

  const [contactList, setContactList] = useState([
    {
      "userAvatar": "xxxxxxx",
      "userName": "custome san custome sancustome sancustome san",
      "userMessage" : "custome san custome sancustome sancustome san",
    },
    {
      "userAvatar": "xxxxxxx",
      "userName": "custome san",
      "userMessage" : "custome san custome sancustome sancustome san",
    },
    {
      "userAvatar": "xxxxxxx",
      "userName": "custome san",
      "userMessage" : "custome san custome sancustome sancustome san",
    },
    {
      "userAvatar": "xxxxxxx",
      "userName": "custome san custome sancustome sancustome san",
      "userMessage" : "custome san custome sancustome sancustome san",
    },
    {
      "userAvatar": "xxxxxxx",
      "userName": "custome san",
      "userMessage" : "custome san custome sancustome sancustome san",
    },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san custome sancustome sancustome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san custome sancustome sancustome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san custome sancustome sancustome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
    // {
    //   "userAvatar": "xxxxxxx",
    //   "userName": "custome san",
    //   "userMessage" : "custome san custome sancustome sancustome san",
    // },
  ])

  const sendMessage = () => {
    if(messageContent.trim().length < 10){
      toast({
        title: t('demandorder.detail.prompt'),
        description: t('demandorder.detail.messagePromptDescription')
      })
      return
    }
    const msgData = {
      "role":"customer","msgContent": messageContent
    }
    let temp = [...messageList]
    temp.push(msgData)
    
    setMessageList(temp)
  }

  useEffect(() => {
    console.log("open change", open)
  }, [open])

  useEffect(() => {
    if (connected && user?.id) {
      login(user?.id, user ?? {})
    }
  }, [connected])


  return (
    <div className="positive z-[999]">
      {showModal ? (
        <div className="absolute right-10 box-border border-2 border-[#F6F6F7] bottom-20 w-[860px] h-[720px] rounded flex">
          {/* chat contact start  */}
          <div className="w-[199px] h-full box-border  border-r-2 border-r-[#F6F6F7] flex flex-col">
            <div className="w-full h-16 bg-white flex justify-center items-center box-border border-b-2 border-b-[#F6F6F7]">
              <input className="input w-4/5 max-w-xs h-8" 
                type="text"
                value={searchContent} placeholder={t('demandorder.detail.messageTip')}
                onChange={(e) => { setSearchContent(e.target.value) }}>
              </input>
            </div>
            <div className="w-full h-full flex-1 overflow-y-auto bg-white">
            {
                contactList.map((item,index) => {
                  return (
                    <div key={index} className={index == selectedIndex ? "flex w-full h-14 items-center px-4 cursor-pointer bg-[#F0F6FE] ":
                    "flex w-full h-14 items-center px-4 cursor-pointer "} onClick={() => {
                      if(index != selectedIndex){
                        setSelectedIndex(index)
                      }
                      
                    }}>
                      <img src={DefaultCustomerAvatar} className="w-8 h-8" />
                      <div className="flex flex-col ml-2">
                        <p className="text-sm text-[#222222] max-w-4/5 max-h-4 overflow-y-hidden text-ellipsis text-nowrap">{item.userName}</p>
                        <p className="text-xs text-[#595959] max-w-4/5 max-h-4 overflow-y-hidden text-ellipsis text-nowrap">{item.userMessage}</p>
                      </div>
                    </div>
                  )
                })
              }
            

            </div>

          </div>
          {/* chat contact end  */}

          {/* chat content start  */}
          <div className="flex-1 h-full flex flex-col">
            <div className="w-full h-16 bg-white flex justify-center items-center positive box-border border-b-2 border-b-[#F6F6F7]">
              <div className="flex items-center">
                <img src={DefaultCustomerAvatar} className="w-8 h-8 rounded-full">
                </img>
                <span className="text-sm text-black ml-2">Chat Bot</span>
              </div>
              <div className="absolute right-5 w-6 h-6 cursor-pointer" onClick={()=>{
                setShowModal(false)
              }}>
                <span className="text-sm text-black">X</span>
              </div>

            </div>

            <div className="w-full bg-[#F6F6F7] flex-1 overflow-y-scroll py-2.5">
            {
              messageList.map((item,index) => {
                if(item.role == 'customer'){
                  return (
                    <div key={index} className="flex justify-start items-center mt-2.5">
                      <img src={DefaultCustomerAvatar} className="w-6 h-6 ml-2 mr-2"></img>
                      <p className="bg-white rounded px-2 py-2 text-sm text-black max-w-[320px]">
                        {item.msgContent}
                      </p>
                    </div>
                  )
                }
                else{
                  return (
                    <div key={index} className="flex justify-end mt-2.5 items-center">
                    
                      <p className="bg-white rounded px-2 py-2 text-sm text-black max-w-[320px]">
                        {item.msgContent}
                      </p>
                      <img src={DefaultServiceAvatar} className="w-6 h-6 ml-2 mr-2"></img>
                    </div>
                  )
                }
              })
            }
            </div>

            <div className="w-full h-32 bg-white flex justify-between items-start py-4">
            <textarea className="textarea textarea-xl flex-1 h-24 ml-2 mr-5" 
                value={messageContent} placeholder={t('demandorder.detail.messageTip')}
                onChange={(e) => { setMessageContent(e.target.value) }}>
            </textarea>
            <div className="w-18 flex mr-5">
              <img src={ServiceFile} className="w-6 h-6 cursor-pointer mr-5">
              </img>
              <img src={ServiceSend} className="w-6 h-6 cursor-pointer" onClick={sendMessage}>
              </img>
            </div>
              
            </div>


          </div>
          {/* chat content end  */}
            
        </div>
      ) : (
        <div className="absolute right-5 bottom-20 w-16 cursor-pointer" onClick={() => {
          setShowModal(true)
        }} >
          <img src={require('@/images/service.png')} className="w-full h-full" />
        </div>
      )}
      </div>
    )
    
    
  
  
}
  // <a className="absolute right-5 bottom-20 w-16 cursor-pointer" href="https://wa.me/85267548453" target="_blank">
  //   <img src={require('@/images/service.png')} className="w-full h-full" />
  // </a>
