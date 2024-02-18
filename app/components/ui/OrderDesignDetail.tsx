import { Suspense, useEffect, useRef, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Link } from "@remix-run/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form';
import {t} from "i18next";
import UploaderDialog from "~/components/form/UploaderDialog";
import Uploader, { UploaderHandler } from "~/components/form/Uploader";
import { DemandAttachmentValidator, DemandDocumentValidator, DemandDelValidator } from "~/utils/validators";
import {PainCard, ProjectCard } from "~/components/ui/Card"
import { FileContent } from "~/components/form/Uploader";
import { InputError } from "../ui/Errors"
import { TimelineStatus, DemandStatus} from '@/utils/definition'
import dayjs from 'dayjs';
import { getAllAllowTypes } from '@/utils/helpers'
import Datepicker from "react-tailwindcss-datepicker";
import { useAppearanceStore } from "~/utils/store"
import Confirm from "./modalConfirm";

type DesignProps = {
    data?: DesignDetail;
    nexturl?: string;
    upload?: (projectId: string | undefined | number, files: FileContent[], type: number) => void;
    onDocDelete?:(id: number) => void;
    onRename?: (id: number, name: string) => void;
    onAddSource?: (name: string, link: string) => void;
    onEditSource?: (id: number, name: string, link: string) => void;
    onDelSource?: (id: number) =>void;
    onCompleteChange?: (status: number, toUserId: number) => void;
 }
 type DesignDetail = {
    projectId?: number;
    attachments?: Attachment[];
    documents?:  any[];
    final_delivery_time?: string;
    full_delivery_time?: string;
    draft_delivery_time?: string;
    timeline_status?: string;
    user_id: number;
 }
 type Attachment = {
    name?: string;
    link?: string;
    description?: string;
    id: number;
    source_from?:number;
}

export const iconTYpe = {
    word: 
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_262_704)">
    <mask id="mask0_262_704" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
    <path d="M-1 0H23V24H-1V0Z" fill="white"/>
    </mask>
    <g mask="url(#mask0_262_704)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#366AFF"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16.088 0V5.37046C16.088 5.74034 16.3848 6.0401 16.751 6.0401H22.002L16.088 0Z" fill="white" fill-opacity="0.25"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.4021 7.26367H5.00198V19.3222H7.4021L11.0316 15.6929L14.6612 19.3222H17.0614V7.26367H14.6612V15.8685L11.0316 12.2392L7.4021 15.8685V7.26367Z" fill="white"/>
    </g>
    </g>
    <defs>
    <clipPath id="clip0_262_704">
    <rect width="22" height="24" fill="white"/>
    </clipPath>
    </defs>
    </svg>,
    excel: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
    <g clip-path="url(#clip0_262_732)">
      <mask id="mask0_262_732" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
        <path d="M-1 0H23V24H-1V0Z" fill="white"/>
      </mask>
      <g mask="url(#mask0_262_732)">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#52C41A"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.6996 7.7998V10.1998H8.28194C7.42216 10.1998 6.74278 10.7958 6.74278 11.4988C6.74278 12.157 7.34247 12.7295 8.12857 12.7916L8.28194 12.7978L14.754 12.8018C16.7824 12.8018 18.4718 14.2371 18.6787 16.1178L18.6944 16.3074L18.6998 16.5007C18.6998 18.4822 17.048 20.0933 14.9622 20.1949L14.7605 20.1997H5.29877V17.7998H14.7605C15.6202 17.7998 16.2995 17.2038 16.2995 16.5008C16.2995 15.8425 15.6999 15.27 14.9138 15.2079L14.7605 15.2018L8.35905 15.1978L8.074 15.1928C6.14519 15.0983 4.56348 13.6976 4.36368 11.8817L4.34797 11.6922L4.34265 11.4988C4.34265 9.51731 5.99438 7.90621 8.08024 7.80465L8.28194 7.7998H17.6996Z" fill="white"/>
      </g>
    </g>
    <defs>
      <clipPath id="clip0_262_732">
        <rect width="22" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>,
    text: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
    <g clip-path="url(#clip0_262_798)">
      <mask id="mask0_262_798" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
        <path d="M-1 0H23V24H-1V0Z" fill="white"/>
      </mask>
      <g mask="url(#mask0_262_798)">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#366AFF"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17 9V11.4H13V20H10.6V11.4H6.59998V9H17Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
      </g>
    </g>
    <defs>
      <clipPath id="clip0_262_798">
        <rect width="22" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>,
  ppt:<svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
  <g clip-path="url(#clip0_262_718)">
    <mask id="mask0_262_718" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
      <path d="M-1 0H23V24H-1V0Z" fill="white"/>
    </mask>
    <g mask="url(#mask0_262_718)">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#FFA940"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M14.315 7.79988C16.4822 7.79988 18.2538 9.44489 18.2538 11.4987C18.2538 13.5529 16.4823 15.198 14.3178 15.1979L7.67163 15.2912C7.41625 15.2946 7.21107 15.5025 7.21107 15.758V19C7.21107 19.4287 6.98236 19.8249 6.61103 20.0393C6.23982 20.2538 5.78227 20.2538 5.41086 20.0394C5.0395 19.825 4.81089 19.4288 4.81104 19V15.4986C4.81155 14.0072 6.02035 12.7983 7.51162 12.7979H14.315C15.1748 12.7979 15.8537 12.202 15.8537 11.4987C15.8537 10.7958 15.1747 10.2 14.315 10.2L6.01324 10.2C5.58142 10.2047 5.18028 9.97699 4.96303 9.60376C4.74573 9.23059 4.74573 8.76932 4.96301 8.39618C5.18028 8.02291 5.58142 7.7952 6.01324 7.79988H14.315Z" fill="white"/>
    </g>
  </g>
  <defs>
    <clipPath id="clip0_262_718">
      <rect width="22" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>,
image: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
<g clip-path="url(#clip0_262_784)">
  <mask id="mask0_262_784" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
    <path d="M-1 0H23V24H-1V0Z" fill="white"/>
  </mask>
  <g mask="url(#mask0_262_784)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#09CFBE"/>
    <path d="M14.6392 10.5254C14.7008 10.5721 14.7554 10.6281 14.8008 10.6918L19.8514 17.7504C20.022 17.9886 20.0477 18.3053 19.9181 18.5694C19.7885 18.8335 19.5255 19 19.2381 19H11.8714L12.476 16.3724L11.5208 13.5609L13.5736 10.6918C13.6934 10.5243 13.873 10.4127 14.0728 10.3815C14.2726 10.3503 14.4765 10.4021 14.6392 10.5254ZM10.5773 13.5486L11.524 16.3724L10.9192 19H4.75599L4.73812 18.9995C4.4552 18.9904 4.20049 18.8206 4.07671 18.5585C3.95293 18.2965 3.98048 17.9854 4.14825 17.7507L6.82345 14.0081C6.96702 13.8072 7.19488 13.6885 7.43718 13.6885C7.67949 13.6885 7.90735 13.8072 8.05091 14.0081L9.14905 15.5445L10.5773 13.5486ZM8.19038 9C8.73481 9 9.23787 9.29899 9.51009 9.78433C9.7823 10.2697 9.7823 10.8677 9.51009 11.353C9.23787 11.8383 8.73481 12.1373 8.19038 12.1373C7.34877 12.1373 6.66652 11.435 6.66652 10.5687C6.66652 9.70232 7.34877 9 8.19038 9Z" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
  </g>
</g>
<defs>
  <clipPath id="clip0_262_784">
    <rect width="22" height="24" fill="white"/>
  </clipPath>
</defs>
</svg>,
pdf:<svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
<g clip-path="url(#clip0_262_747)">
<mask id="mask0_262_747" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
  <path d="M-1 0H23V24H-1V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_262_747)">
  <mask id="mask1_262_747" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
    <path d="M-1 0H23V24H-1V0Z" fill="white"/>
  </mask>
  <g mask="url(#mask1_262_747)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#FF4D4F"/>
  </g>
  <mask id="mask2_262_747" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
    <path d="M-1 0H23V24H-1V0Z" fill="white"/>
  </mask>
  <g mask="url(#mask2_262_747)">
    <path opacity="0.99" d="M10.6751 6.8999L10.9411 6.91202C11.2818 6.94973 11.6164 7.13628 11.8274 7.41859C12.3295 8.11357 12.2721 9.53554 11.656 11.4876C12.2268 12.5607 12.9748 13.5296 13.7812 14.3288C14.6458 14.1608 15.3781 14.0743 16.0753 14.0744C17.4701 14.101 18.0918 14.6368 18.1007 15.36L18.0974 15.4698C18.0974 16.2437 17.6653 16.6343 16.9384 16.755C16.8271 16.7735 16.7255 16.7847 16.6088 16.7914L16.3475 16.7991L16.1877 16.7998C15.1695 16.7231 14.2223 16.3442 13.5458 15.7141C12.1549 16.0209 10.7738 16.4691 9.31678 17.0425C8.18348 19.0535 7.11347 20.0998 6.16094 20.0998C5.9219 20.0998 5.70532 20.0489 5.57593 19.9443C5.15724 19.7556 4.90002 19.3321 4.90002 18.8754C4.90002 18.3029 5.32831 17.7112 6.58779 16.9941L6.9706 16.7858L7.40074 16.57C7.70374 16.4236 8.03968 16.2719 8.41134 16.1142C9.16924 14.7327 9.78377 13.2744 10.3171 11.7173C9.46555 9.99191 9.05169 8.444 9.59663 7.53493C9.81295 7.14094 10.2191 6.90612 10.6751 6.8999ZM11.129 13.5018L10.9549 13.94C10.7431 14.4588 10.5276 14.951 10.306 15.4199L10.15 15.7408L10.5131 15.6132C11.0018 15.448 11.508 15.2985 12.004 15.1724L12.408 15.0748L12.2411 14.9011C11.8773 14.5113 11.5455 14.1047 11.2593 13.6959L11.129 13.5018ZM15.7834 15.3595L15.5841 15.367L15.477 15.3758L15.6344 15.4234C15.7487 15.4539 15.8692 15.4785 15.9986 15.4986L16.1999 15.5254C16.3689 15.5473 16.5438 15.5384 16.7121 15.5019L16.772 15.4848L16.7606 15.4747C16.6821 15.4179 16.5045 15.3711 16.1915 15.3603L15.7834 15.3595ZM10.807 8.18778L10.745 8.18905L10.722 8.19178L10.6953 8.33264C10.6387 8.71457 10.676 9.12012 10.7968 9.52568L10.838 9.64978L10.8728 9.49097C10.9381 9.11347 10.9291 8.72573 10.8475 8.34426L10.807 8.18778Z" fill="white"/>
  </g>
  <mask id="mask3_262_747" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
    <path d="M-1 0H23V24H-1V0Z" fill="white"/>
  </mask>
  <g mask="url(#mask3_262_747)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
  </g>
</g>
</g>
<defs>
<clipPath id="clip0_262_747">
  <rect width="22" height="24" fill="white"/>
</clipPath>
</defs>
</svg>,
code:<svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
<g clip-path="url(#clip0_262_770)">
<mask id="mask0_262_770" maskUnits="userSpaceOnUse" x="-1" y="0" width="24" height="24">
<path d="M-1 0H23V24H-1V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_262_770)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0.662946 0H16.0866L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0Z" fill="#366AFF"/>
<path d="M11.651 9.82209L11.7454 9.83736L12.5562 10.0266C12.851 10.1003 13.0353 10.3496 13.0127 10.6528L12.9973 10.7556L11.0055 18.3999C10.933 18.6898 10.6419 18.881 10.3511 18.858L10.2545 18.8423L9.44376 18.6531C9.15324 18.5805 8.96262 18.3107 8.98651 18.021L9.00257 17.924L10.9944 10.2798C11.0508 10.0542 11.2394 9.88846 11.4583 9.83699L11.5537 9.82209H11.651ZM15.8558 9.96992L15.9248 10.0412L19.0754 13.9457C19.2182 14.1242 19.236 14.3583 19.1288 14.6022L19.0753 14.7072L15.9106 18.6543C15.7043 18.8606 15.4251 18.91 15.1705 18.7787L15.0764 18.7209L14.4565 18.2089C14.2375 18.0263 14.1829 17.6936 14.3165 17.4503L14.3755 17.3638L16.83 14.3388L14.3893 11.3312C14.1897 11.1317 14.1754 10.8268 14.3254 10.6073L14.3893 10.5294L14.4572 10.4702L15.0736 9.96105C15.3129 9.75601 15.6364 9.77546 15.8558 9.96992ZM6.80244 9.87402L6.89656 9.93179L7.51858 10.4457C7.74581 10.6404 7.81758 10.9412 7.70309 11.1959L7.65137 11.289L5.19496 14.3128L7.61061 17.3215C7.81019 17.5211 7.82447 17.826 7.68021 18.0411L7.61874 18.1171L7.54272 18.1825L6.92627 18.6917C6.68706 18.8967 6.36349 18.8773 6.14409 18.6828L6.07508 18.6116L2.91432 14.6931C2.7794 14.4907 2.76254 14.2276 2.87058 14.0273L2.92414 13.9462L6.06238 9.9984C6.26866 9.79212 6.54787 9.74269 6.80244 9.87402Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
</g>
</g>
<defs>
<clipPath id="clip0_262_770">
<rect width="22" height="24" fill="white"/>
</clipPath>
</defs>
</svg>,
unknown: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
<g clip-path="url(#clip0_262_811)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M16.0866 0L22 6.0401V23.3304C22 23.7001 21.7032 24 21.3371 24H0.662946C0.296768 24 0 23.7001 0 23.3304V0.669642C0 0.299765 0.296768 0 0.662946 0H16.0866ZM11.5 15H4.5C4.22386 15 4 15.2239 4 15.5V17.1C4 17.3761 4.22386 17.6 4.5 17.6H11.5C11.7761 17.6 12 17.3761 12 17.1V15.5C12 15.2239 11.7761 15 11.5 15ZM15.5 9H4.5C4.22386 9 4 9.22386 4 9.5V11.1C4 11.3761 4.22386 11.6 4.5 11.6H15.5C15.7761 11.6 16 11.3761 16 11.1V9.5C16 9.22386 15.7761 9 15.5 9Z" fill="#366AFF"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M16 0V5.3348C16 5.70222 16.3011 6 16.6727 6H22L16 0Z" fill="white" fill-opacity="0.25"/>
</g>
<defs>
<clipPath id="clip0_262_811">
<rect width="22" height="24" fill="white"/>
</clipPath>
</defs>
</svg>
}




const DesignerDetail = (designProps : DesignProps) => {
    const btnDesc: {[key: number]: string} = {
        // 0: '初稿完成',
        1: t('demandorder.detail.draftend'),
        2: t('demandorder.detail.finalend')
    }
    const {
        data: {
            projectId = '',
            attachments = [],
            documents = [],
            timeline_status = 0,
            user_id = 0,
            status,
        } = {},
        nexturl,
        upload = (projectId: string | number | undefined, files: FileContent[], type: number) => {},
        onDocDelete = () => {},
        onRename = () => {},
        onAddSource = () => {},
        onDelSource = () => {},
        onEditSource = () => {},
        onCompleteChange = (status: number, toUserId: number) => {}
    } = designProps || {};
    const [bookType, setBookType] = useState(1 as number)
    const { register, handleSubmit, formState: { errors }, setValue } = useForm({ resolver: zodResolver(DemandAttachmentValidator), mode: "onChange" })
    const { register: documentRegister, handleSubmit: handleDocumentRnameSubmit, formState: { errors: documentError }, setValue: setDocValue } = useForm({ resolver: zodResolver(DemandDocumentValidator), mode: "onChange"})
    const { register: docdelRegister, handleSubmit: handleDocumentDelSubmit, formState: { errors: documentdelError } ,  setValue: setDocDelValue} = useForm({ resolver: zodResolver(DemandDelValidator), mode: "onChange"})


    const groupedDocument = documents.reduce((result, item) => {
        (result[item.type] = result[item.type] || []).push(item);
        return result;
      }, {});
      


    const onUploadBook = (files: FileContent[]) => {
        upload(projectId,files, bookType)
    }
    const onSourceSubmit = useCallback(handleSubmit(data => {
        sourceAddDialog?.close()
        const {
            id,
            name,
            link,
        } = data;
        if (id) {
            onEditSource(parseInt(id), name, link)
        } else {
            onAddSource(name, link)
        }
 
    }), [])
    const onDocRenameSubmit = useCallback(handleDocumentRnameSubmit(data => {
        renameDialog?.close()
        const {
            name,
            id,
        } = data;
        onRename(id, name)
    }), [])

    const onDocDelSubmit = useCallback(handleDocumentDelSubmit(data => {
        deleteDialog?.close()
        const {
            id,
        } = data;
        onDocDelete(id)
    }), [])

    const handleBookTypeChange = (type: number) => {
        setBookType(type)
    }
    // console.log('bookType && timeline_status', bookType == timeline_status && timeline_status !== '2')
    return (
        <>
            <div className="grid grid-cols-1 gap-4 bg-base-100 md:rounded-md w-full p-4">
                <div>
                    <div className={`badge mx-2 ${bookType === 1? 'badge-ghost' : ''} cursor-pointer`} onClick={()=>handleBookTypeChange(1)}>{t('demandorder.detail.draft')}</div>
                    <div className={`badge mx-4 cursor-pointer ${bookType === 2? 'badge-ghost' : ''}`} onClick={() => handleBookTypeChange(2)}>{t('demandorder.detail.full')}</div>
                    {/* <div className={`badge mx-4 cursor-pointer ${bookType === 2? 'badge-ghost' : ''}`} onClick={() => handleBookTypeChange(2)}>源文件</div> */}
                </div>
                {[1,2].indexOf(bookType)>-1 && <div className="flex flex-wrap gap-4">
                    <AnimatePresence>
                        {
                            groupedDocument?.[bookType]?.map((document: any, index: number) => {
                                return (<motion.div
                                    key={`${document.id}_${index}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    >
                                    <PainCard {...document}
                                        cover={document.pages[0]?.litpic_url as string}
                                        name={document.project_name as string}
                                        createdAt={document.created_at as string}
                                        
                                        next={`/project/${projectId}/detail/${document.id}`}
                                        // next={process?.env?.V1_END_POINT + "/project/detail?id=" + document.id}
                                        // next={"/project/detail?id=" + document.id}
                                        edit={() => {
                                            setDocValue("id", document.id)
                                            setDocValue("name", document.project_name)
                                            renameDialog?.showModal()
                                        }}
                                        {
                                            ...document?.marks?.length <=0 ?{
                                                delete: () => {
                                                    // setEditDocument(document)
                                                    setDocDelValue("id", document.id)
                                                    deleteDialog?.showModal()
                                                }

                                            } :{}
                                        }
                                    />
                                    </motion.div>)
                                
                            })
                        }
                    </AnimatePresence>
                    {status >=DemandStatus.progressing 
                    // && timeline_status >= TimelineStatus.DESINNERCONFIRMED 
                    && <div className="rounded-md bg-base-50 border-dashed border w-40 md:w-72 h-48">
                        <span className="flex items-center justify-center flex-col h-full cursor-pointer" onClick={() => (window as any).uploaderDialog?.showModal()}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.94a.75.75 0 001.5 0v-4.94l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                            </svg>
                            <div>上传设计图</div>
                        </span>
                    </div>}
                </div>}
                {
                  ((bookType == 1 && timeline_status == TimelineStatus.DESINNERCONFIRMED) || (bookType == 2 && timeline_status == TimelineStatus.FINISHEDDAFT)) &&  <div><button className="btn btn-primary btn-sm" onClick={() => {
                    if (timeline_status == TimelineStatus.DESINNERCONFIRMED) {
                        onCompleteChange(TimelineStatus.FINISHEDDAFT, user_id)
                    } else {
                        onCompleteChange(TimelineStatus.FINISHEDFULL, user_id)
                    }
                }}>{btnDesc[bookType]}</button></div>
                }
                {
                   [2].indexOf(bookType)>-1 && bookType !== timeline_status &&<div className="grid grid-cols-1 gap-4 bg-base-100 md:rounded-md w-full p-4">
                     <div className="flex justify-between items-center">
                         <div className="flex items-center">{t("demandorder.detail.sourceFiles")}
                             <div className="lg:tooltip tooltip-warning" data-tip="设计完成后客户可见">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                 </svg>
                             </div>
                         </div>
                             <div className="w-2/3 text-right">
                             {/* <input type="text" placeholder="请粘贴文件地址" className="input input-bordered h-8 w-2/3 m-4"/> */}
                             {status >=DemandStatus.progressing && timeline_status >= TimelineStatus.DESINNERCONFIRMED &&<button className="btn btn-sm btn-primary" onClick={() => { 
                                 setValue("name", '');
                                 setValue("link", '');
                                 setValue("id", 0);
                                 sourceAddDialog?.showModal()
                             }}>{t("demandorder.detail.add")}</button>}
                         </div>
                     </div>
                     <div className="overflow-x-auto">
                         <table className="table">
                             {/* head */}
                             <thead>
                             <tr>
                                 <th>{t("demandorder.detail.fileName")}</th>
                                 <th>{t("demandorder.detail.linkUrl")}</th>
                                 <th>{t("demandorder.detail.action")}</th>
                                 <th></th>
                             </tr>
                             </thead>
                             <tbody>
                             {
                               attachments?.length > 0  && attachments?.filter(item => item.source_from == 1)?.map((item: Attachment, index: number) => {
                                     return (
                                         <tr key={index}>
                                             <td>{item?.name || '--'}</td>
                                             <td>{item?.link || '--'}</td>
                                             {status >=4 && <td className="flex">
                                                 <div className="cursor-pointer" onClick={() => { 
                                                     setValue("name", item.name);
                                                     setValue("link", item.link);
                                                     setValue("id", item.id);
                                                     sourceAddDialog?.showModal();
                                                 }}>
                                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                                                         <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                     </svg>
                                                 </div>
                                                 <div className="cursor-pointer" onClick={() => {
                                                     onDelSource(item.id)
                                                 }}>
                                                     <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {}} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                                                         <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                     </svg>
                                                 </div>
                                             </td>}
                                         </tr>
                                     )
                                 })
                             }
                             {
                                attachments?.filter(item => item.source_from == 1)?.length <=0 &&  <tr className="text-center font-thin text-xs"><td colSpan={status >=4 ? 4: 3}>Empty</td></tr>
                             }
                             </tbody>
                         </table>
                     </div>
                 </div>
                }
            <UploaderDialog upload={onUploadBook} allowedTypes={["image/png", "image/jpeg", "application/pdf"]} />
            </div>
            <dialog id="renameDialog" className="modal">
                <form method="dialog" className="modal-box" onSubmit={onDocRenameSubmit}>
                    <h3 className="font-bold text-lg">{t("demandorder.detail.rename")}</h3>
                    <div className="py-4 form-control">
                        <label className="label">{t("project.enterNewName")}<InputError hidden={!documentError.name} error={documentError.name?.message as string} /></label>
                        <input type="text" {...documentRegister("name") } className={`w-full input input-bordered input-sm ${documentError.name && "input-error"}`} id="name" />
                        <input type ="text" {...documentRegister("id")} id="id" style={{ display: 'none'}}/>
                    </div>
                    <div className="modal-action">
                        <a className="btn" onClick={() => {
                            renameDialog?.close()
                        }}>{t("cancel")}</a>
                        <button type="submit" className="btn btn-primary">{t("ok")}</button>
                    </div>
                </form>
            </dialog>
            <dialog id="deleteDialog" className="modal">
                <form method="dialog" className="modal-box" onSubmit={onDocDelSubmit}>
                    <h3 className="font-bold text-lg">{t("project.removeProject")}</h3>
                    <p className="py-4">{t("project.removeWarning")}</p>
                    <input type ="text" {...docdelRegister("id")} id="id" style={{ display: 'none'}}/>
                    <div className="modal-action">
                        <a className="btn" onClick={() => {
                            // setDeleteDialogVisible(false)
                            deleteDialog?.close()
                        }}>{t("cancel")}</a>
                        <button className="btn btn-primary">{t("ok")}</button>
                    </div>
                </form>
            </dialog>
           <dialog id="sourceAddDialog" className="modal">
                <form method="dialog" className="modal-box" onSubmit={onSourceSubmit}>
                    <h3 className="font-bold text-lg">{t("demandorder.detail.addSource")}</h3>
                    <div className="py-4 form-control">
                        <label className="label">文件名称 <InputError hidden={!errors.name} error={errors.name?.message as string} /></label>
                        <input type="text" {...register("name")} id="name" className={`w-full input input-bordered input-sm ${errors.name && "input-error"}`} />
                    </div>
                    <div className="py-4 form-control">
                        <label className="label">文件路径 <InputError hidden={!errors.link} error={errors.link?.message as string} /></label>
                        <input type="text"  {...register("link")} id="link" className={`w-full input input-bordered input-sm ${errors.link && "input-error"}`} />
                    </div>
                    <input type ="text" {...register("id")} id="id"  style={{ display: 'none'}}/>
                    <div className="modal-action">
                        <a className="btn" onClick={() => {
                            sourceAddDialog?.close()
                        }}>{t("cancel")}</a>
                        <button type="submit" className="btn btn-primary">{t("ok")}</button>
                    </div>
                </form>
            </dialog>
        </>
    );
}
const DesignerTimeLine = ({ data }: any) => {
    const lang = useAppearanceStore(state => state.lang)
    const {
        final_delivery_time,
        full_delivery_time,
        draft_delivery_time,
        timeline_status,
        page,
        type,
    } = data;

    const p = page== undefined || page == 0 ? 100: page
    let compage = Math.floor((p-1)/10) + 2
    if (p > 100) {
        compage = -1
    }
    if([1,3].indexOf(type) > -1 || type >= 5) {
        compage = 2
    }
    const [finalDeliveryData, setFinalDeliveryData] = useState({startDate: final_delivery_time, endDate:final_delivery_time})
    return (
        <div className="grid grid-cols-1 gap-4 bg-base-100 md:rounded-md w-full p-4 relative">
            <div className="flex items-center justify-between"><div>TIMELINE</div></div>
            <div>
                <ul className="steps w-full">
                    <li data-content="" className="step step-neutral after:!h-4 after:!w-4 before:!h-1">
                        <div className="font-thin text-xs">{t('demandorder.timeline.drafttime')}</div>
                        <div className="font-thin text-xs"><div className="leading-8 h-8">{timeline_status > TimelineStatus.EMPLOYCONFIRMED ? dayjs(draft_delivery_time).format('YYYY-MM-DD hh:mm:ss'): '2days'}</div></div>
                    </li>
                    {(!([1,3].indexOf(type) > -1 || type > 5) || p <4) && <li data-content="" className="step step-neutral after:!h-4 after:!w-4 before:!h-1">
                        <div className="font-thin text-xs">{t('demandorder.timeline.comptime')}</div>
                        <div className="font-thin text-xs"><div className="leading-8 h-8">{timeline_status > TimelineStatus.DESINNERCONFIRMED ? dayjs(full_delivery_time).format('YYYY-MM-DD hh:mm:ss') : `${compage ==-1 ? '12-15': compage}days`}</div></div>
                    </li>}
                    <li data-content="" className="step step-neutral after:!h-4 after:!w-4 before:!h-1 ">
                        <div className="font-thin text-xs">{t('demandorder.timeline.finaltime')}</div>
                        <div className="font-thin text-xs">
                            {/* <Datepicker
                                useRange={false}
                                inputId="finalTime"
                                inputName="finalTime"
                                i18n={lang === "zh" ? "zh" : lang === "en" ? "en" : "zh-TW"}
                                inputClassName="w-full input input-bordered input-sm"
                                value={finalDeliveryData}
                                popoverDirection="down"
                                containerClassName="absolute bottom-2.5 right-20 opacity-0 hover:opacity-100"
                                asSingle
                                onChange={(value) => {
                                    
                                    (window as any)?.comfirmDialog?.showModal()
                                }}
                            /> */}
                            <div className="leading-8 h-8 cursor-pointer hover:opacity-100">{!finalDeliveryData?.startDate ? '--' : dayjs(finalDeliveryData?.startDate).format('YYYY-MM-DD')}</div>
                        </div>
                    </li>
                </ul>
            </div>
            <dialog id="comfirmDialog" className="modal bg-base-100">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">确认</h3>
                    <p className="py-4">确定修改时间吗？修改时间需要与客户确认</p>
                    <div className="modal-action">
                    <a className="btn" onClick={() => {
                        (window as any)["comfirmDialog"]?.close();
                    }}>{t("cancel")}</a>
                    <button className="btn btn-primary" onClick={() => {
                        // setFinalDeliveryData()
                    }}>{t("ok")}
                    </button>
                    </div>
                </div>
            </dialog>
        </div>
    )
}

const EmployerDetail = ({ onEmployDelSource = () => {}, employerLoading = false,upload, multiple, data, uploaderChange, ...others}: any) => {
   
    const { register, handleSubmit, formState: { errors }, setValue } = useForm({ resolver: zodResolver(DemandAttachmentValidator), mode: "onChange" })
    // const [uploadData, setUploadData] = useState<FileContent[]>([])
    const uploadRef = useRef<UploaderHandler>(null)
    const {
        empfile_list = [],
        attachments = []
    } = data;
    const {
        onAddSource = () => {},
        onDelSource = () => {},
        onEditSource = () => {},
        ...props
    } = others;

    const onSourceSubmit = useCallback(handleSubmit(data => {
        sourceAddDialog?.close()
        const {
            id,
            name,
            link,
        } = data;
        if (id) {
            onEditSource(parseInt(id), name, link)
        } else {
            onAddSource(name, link)
        }
    }), [])

    return  (<><div>
        <div className="flex text-sm mx-2">
            <div className="w-full py-4">{t('demandorder.detail.sourceFiles')}</div>
        </div>
        <div className="overflow-x-auto h-45">
             <Uploader
                className='!h-16 p-2'
                asyncChange={(files: FileContent[]) => {
                    console.log('ttttt', files)
                    uploaderChange(files);
                }}
                ref={uploadRef}
                previewOpen={() => {}}
                previewClose={() => {}}
                multiple
                allowedTypes={getAllAllowTypes()}
                sync
            />
            {
              <table className="table">
                <tbody>
                    {
                        employerLoading && <tr className="text-center font-thin text-xs"><td colSpan={3}> <span className="loading loading-ring loading-lg"></span></td></tr>
                    }
                    {
                        empfile_list.length > 0  && empfile_list?.map((item: Attachment, index: number) => {
                            return (
                                <tr key={index} className="cursor-pointer hover:bg-base-200">
                                    <td onClick={() => {
                                    if (item?.file_url)
                                        window.open(item?.file_url)
                                        }}>{item.type!==undefined ? iconTYpe?.[item.type] : '--'}</td>
                                    <td>{item?.file_name || '--'}</td>
                                    {/* <td>{item?.file_url || '--'}</td> */}
                                    <td className="flex">
                                        <div className="cursor-pointer" onClick={() => {
                                            onEmployDelSource(item.id)
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {}} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    }
                    {
                        empfile_list?.length <=0 &&  <tr className="text-center font-thin text-xs"><td colSpan={3}>Empty</td></tr>
                    }
                </tbody>
              </table>
            }
        </div>
        </div>
        <div className="overflow-x-auto py-4">
        <div className="flex text-sm mx-2">
            <div className="w-full py-4">{t("demandorder.detail.link")}</div>
            <div className="w-full text-right">
                <button className="btn btn-sm btn-primary" onClick={() => { 
                    setValue("name", '');
                    setValue("link", '');
                    setValue("id", 0);
                    sourceAddDialog?.showModal()
                }}>{t("demandorder.detail.add")}</button>
            </div>
        </div>
        <table className="table">
            <thead>
            <tr>
                <th>{t("demandorder.detail.fileName")}</th>
                <th className="hidden lg:table-cell">{t("demandorder.detail.linkUrl")}</th>
                <th>{t("demandorder.detail.action")}</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {
                attachments.length > 0  && attachments?.filter((item: Attachment) => item.source_from === 0)?.map((item: Attachment, index: number) => {
                    return (
                        <tr key={index} className="cursor-pointer hover:bg-base-200">
                            <td className="max-w-0 w-full whitespace-nowrap">
                                {item?.name || '--'}
                                <dl className="font-normal lg:hidden">
                                    <td className="sr-only lg:hidden">{t("demandorder.detail.linkUrl")}</td>
                                    <dd className="mt-1 truncate text-gray-500 sm:text-gray-700"><a className="text-primary" href={`${item?.link}`}>{item?.link || '--'}</a></dd>
                                </dl>
                            </td>
                            <td className="hidden lg:table-cell">
                                <a className="text-primary" href={`${item?.link}`}>{item?.link || '--'}</a>
                            </td>
                             <td className="flex">
                                <div className="cursor-pointer" onClick={() => { 
                                    setValue("name", item.name);
                                    setValue("link", item.link);
                                    setValue("id", item.id);
                                    sourceAddDialog?.showModal();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                </div>
                                <div className="cursor-pointer" onClick={() => {
                                    onDelSource(item.id)
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {}} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </div>
                            </td>
                        </tr>
                    )
                })
            }
            {
            attachments.filter((item: Attachment) => item.source_from === 0)?.length <=0 && <tr className="text-center font-thin text-xs"><td colSpan={4}>Empty</td></tr>
            }
            </tbody>
        </table>
        <dialog id="sourceAddDialog" className="modal">
            <form method="dialog" className="modal-box" onSubmit={onSourceSubmit}>
                <h3 className="font-bold text-lg">{t("demandorder.detail.addSource")}</h3>
                <div className="py-4 form-control">
                    <label className="label">{t('demandorder.detail.fileName')} <InputError hidden={!errors.name} error={errors.name?.message as string} /></label>
                    <input type="text" {...register("name")} id="name" className={`w-full input input-bordered input-sm ${errors.name && "input-error"}`} />
                </div>
                <div className="py-4 form-control">
                    <label className="label">{t('demandorder.detail.linkUrl')} <InputError hidden={!errors.link} error={errors.link?.message as string} /></label>
                    <input type="text"  {...register("link")} id="link" className={`w-full input input-bordered input-sm ${errors.link && "input-error"}`} />
                </div>
                <input type ="text" {...register("id")} id="id"  style={{ display: 'none'}}/>
                <div className="modal-action">
                    <a className="btn" onClick={() => {
                        sourceAddDialog?.close()
                    }}>{t("cancel")}</a>
                    <button type="submit" className="btn btn-primary">{t("ok")}</button>
                </div>
            </form>
        </dialog>
    </div>
   </>)
}
export {
    DesignerDetail,
    DesignerTimeLine,
    EmployerDetail,
}