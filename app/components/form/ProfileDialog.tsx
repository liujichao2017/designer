import React, { useEffect } from 'react'
import { ChangeEvent, useCallback, forwardRef } from "react"
import { EditorIcon } from "../ui/Icons"
import { useForm } from "react-hook-form"
import { InputError } from "../ui/Errors"
import { zodResolver } from "@hookform/resolvers/zod"
import { Profilealidator } from "~/utils/validators"
import { Label } from "@/components/ui/labelnew"
import { t } from "i18next";


export type ValueHandler = {
    reset: (data: any) => void
}

type Props = {
    name?: string;
    data: FProps;
    onOk: (data: FProps) => void;
    onCancel?: ()=>{}
}

type FormProps = {
   data: FProps
   onOk: (data: FProps) => void;
   onCancel?: ()=>void
}

type FProps = {
    phone?: string;
    email?: string;
    title?: string;
    gender?: number | string;
    language?: number | string;
    city?: string;
    bank?: string;
    account?: string;
}

export const ProfileForm = (props: FormProps) => {
    const {
        data,
        onOk,
        onCancel,
    } = props;

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({ defaultValues:data, resolver: zodResolver(Profilealidator), mode: "onChange" })
    const onSubmit = (data: FProps) => {
        console.log(data);
        onOk(data);
      };
    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <h3 className="font-bold text-lg text-left">基本信息</h3>
            <div className='grid w-full items-center gap-4 grid-cols-2'>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.phone')}：<InputError hidden={!errors.phone} error={errors.phone?.message as string} /></Label>
                    <input type="text" {...register("phone")} id="phone" className={`w-96 mx-4 input input-bordered input-sm ${errors.phone && "input-error"}`} />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.email')}： <InputError hidden={!errors.email} error={errors.email?.message as string} /></Label>
                    <input type="text" {...register("email")} id="email" className={`w-96 mx-4 input input-bordered input-sm ${errors.email && "input-error"}`} />
                </div>
            </div>
            <div className='grid w-full items-center gap-4 grid-cols-2'>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.title')}：<InputError hidden={!errors.title} error={errors.title?.message as string} /></Label>
                    <input type="text" {...register("title")} id="title" className={`w-96 mx-4 input input-bordered input-sm ${errors.title && "input-error"}`} />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.gender')}： <InputError hidden={!errors.gender} error={errors.gender?.message as string} /></Label>
                    <select id="gender" className="select h-8 min-h-0 max-h-8 border-none text-xs focus:outline-none mx-4 w-96" {...register("gender")}>
                        <option value="0">{t('userPortfolio.genderoptions.0')}</option>
                        <option value="1">{t('userPortfolio.genderoptions.1')}</option>
                    </select>
                    {/* <input type="text" {...register("gender")} id="gender" className="hidden" /> */}
                </div>
            </div>
            <div className='grid w-full items-center gap-4 grid-cols-2'>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.city')}：<InputError hidden={!errors.city} error={errors.phone?.message as string} /></Label>
                    <input type="text" {...register("city")} id="phone" className={`w-96 mx-4 input input-bordered input-sm ${errors.city && "input-error"}`} />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.language')}： <InputError hidden={!errors.language} error={errors.language?.message as string} /></Label>
                    <select id="language" className="select h-8 min-h-0 max-h-8 border-none text-xs focus:outline-none mx-4 w-96"  {...register("language")}>
                        <option value="0">{t("userCenter.languageList.0")}</option>
                        <option value="1">{t("userCenter.languageList.1")}</option>
                        <option value="2">{t("userCenter.languageList.2")}</option>
                    </select>
                    {/* <input type="text" {...register("language")} id="email" className={`w-96 mx-4 input input-bordered input-sm ${errors.language && "input-error"}`} /> */}
                </div>
            </div>
            <h3 className="font-bold text-lg text-left">{t('userPortfolio.bankinfo')}</h3>
            <div className='grid w-full items-center gap-4 grid-cols-2'>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.account')}：<InputError hidden={!errors.bank} error={errors.bank?.message as string} /></Label>
                    <input type="text" {...register("bank")} id="bank" className={`w-96 mx-4 input input-bordered input-sm ${errors.bank && "input-error"}`} />
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label>{t('userPortfolio.bank')}： <InputError hidden={!errors.account} error={errors.account?.message as string} /></Label>
                    <input type="text" {...register("account")} id="account" className={`w-96 mx-4 input input-bordered input-sm ${errors.account && "input-error"}`} />
                </div>
            </div>
            <div className="modal-action">
                <a className="btn" onClick={() => {
                    onCancel?.()
                }}>{t("cancel")}</a>
                <button type="submit" className="btn btn-primary">{t("ok")}</button>
            </div>
        </form>
    )
}

export default forwardRef<ValueHandler, Props>((props: Props, ref) => {
    const {
        name = 'profileDialog',
        data,
        onCancel,
        onOk,
    } = props;

    return (<dialog id={name} autoFocus={false} className="modal">
        <div className="modal-box relative w-[1120px] max-w-[1120px] bg-base-100">
            <ProfileForm data={data} onOk={onOk} onCancel={() => {
                 (window as any)[name]?.close();
                 onCancel?.()
            }}/>
        </div>
    </dialog>)
})