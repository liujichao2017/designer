import { useCallback, useState, forwardRef, useImperativeHandle } from "react"
import Datepicker from "react-tailwindcss-datepicker";
import relativeTime from 'dayjs/plugin/relativeTime'
import { TimeLineValidator } from "~/utils/validators";
import dayjs from 'dayjs';
import { t } from "i18next";
import { zodResolver } from "@hookform/resolvers/zod"
import { useAppearanceStore } from "~/utils/store"
import { useForm } from 'react-hook-form';
import { InputError } from "../ui/Errors"
dayjs.extend(relativeTime)

type Props = {
    name: string;
    onOk?: (data: {
        draftTime: Date,
        complatelTime: Date,
        finalTime: Date,
        id: number,
        toUser: number,
    }) => void;
    onCancel?: ()=>{}
}
export type ValueHandler = {
    reset: (data: any) => void
}
  
export default forwardRef<ValueHandler, Props>((props: Props, ref) => {
    const {
        name = 'timeLineDialog',
        onOk,
        onCancel,
    } = props;
    useImperativeHandle(ref, () => ({
        reset (data: any) {
            setValues(data)
        }
    }))
    
    const setValues = (item: any) => {
        const page = item?.page== undefined || item?.page == 0 ? 100: item.page
        let compage = Math.floor((page-1)/10) + 2
        if (page > 100) {
            compage = -1
        }
        if([1,3].indexOf(item?.type) > -1 || item?.type >= 5) {
            compage = 2
        }
   
        const showsec = !([1,3].indexOf(item?.type) > -1 || item?.type >= 5) || page < 4
        setValue("id", item.id)
        setValue("toUser", item.user_id)
        setValue("draftTime", `2 天`)
        setValue("complatelTime", `${compage ==-1 ? '12-15': compage} 天`)
        setValue("finalTime", 0)
        setValue("showSecond", showsec)
        setFinalTime({
            startDate: item.final_delivery_time? new Date(item.final_delivery_time): null,
            endDate: item.final_delivery_time?  new Date(item.final_delivery_time): null,
        })
        clearErrors()
    }
    const { register, handleSubmit, formState: { errors }, setValue, clearErrors, getValues} = useForm({ resolver: zodResolver(TimeLineValidator), mode: "onChange" })
    const onSourceSubmit = useCallback(handleSubmit(data => {
        const {
            id,
            draftTime,
            complatelTime,
            finalTime,
            toUser,
        } = data;
        console.log(data)
        onOk?.({
            id,
            draftTime,
            complatelTime,
            finalTime,
            toUser,
        });
        (window as any)[name]?.close();
    }), [])
    const lang = useAppearanceStore(state => state.lang)

    const [finalTime, setFinalTime] = useState({
        startDate: null,
        endDate: null
    })
    const showsec = getValues("showSecond")
   
    return (
    <dialog id={name} autoFocus={false} className="modal text-xs md:text-sm">
        <form method="dialog" className="modal-box relative" onSubmit={onSourceSubmit}>
            <h3 className="font-bold text-lg text-center">填写Timeline</h3>
            <div className="h-5"></div>
            <h2>{t("demandorder.timeline.desc")}</h2>
            <ul className="steps steps-vertical">
                <li data-content="" className="step step-neutral before:!w-1 after:!h-4 after:!w-4">
                    <div className="py-4 form-control w-full">
                        <label className="label">{t("demandorder.timeline.drafttime")}<InputError hidden={!errors.draftTime} error={errors.draftTime?.message as string} /></label>
                        <input type="text" {...register("draftTime")} id="name" className={`w-full input input-sm ${errors.name && "input-error"}`} disabled/>
                    </div>
                </li>
                {<li data-content="" className="step step-neutral before:!w-1 after:!h-4 after:!w-4">
                    <div className="py-4 form-control w-full">
                        <label className="label">{t("demandorder.timeline.comptime")} <InputError hidden={!errors.complatelTime} error={errors.complatelTime?.message as string} /></label>
                        <input type="text" {...register("complatelTime")} id="name" className={`w-full input input-sm ${errors.name && "input-error"}`} disabled/>
                    </div>
                </li>}
                <li data-content="" className="step step-neutral before:!w-1 after:!h-4 after:!w-4">
                    <div className="py-4 form-control w-full">
                        <label className="label">{t("demandorder.timeline.finaltime")}<InputError hidden={!errors.finalTime} error={errors.finalTime?.message as string} /></label>
                        <Datepicker
                            useRange={false}
                            inputId="finalTime"
                            inputName="finalTime"
                            i18n={lang === "zh" ? "zh" : lang === "en" ? "en" : "zh-TW"}
                            inputClassName="w-full input input-bordered input-sm"
                            value={finalTime}
                            {...register("finalTime")}
                            readOnly
                            popoverDirection="up"
                            asSingle
                            disabled
                            onChange={(date) => {}}
                        />
                    </div>
                </li>
            </ul>
            <input type ="text" {...register("id")} id="id"  style={{ display: 'none'}}/>
            <input type ="text" {...register("toUser")} id="toUser"  style={{ display: 'none'}}/>
            <input type ="text" {...register("showSecond")} id="toUser"  style={{ display: 'none'}}/>
            <div className="modal-action">
                <a className="btn" onClick={() => {
                    (window as any)[name]?.close();
                    onCancel?.()
                }}>{t("cancel")}</a>
                <button type="submit" className="btn btn-primary">{t("ok")}</button>
            </div>
        </form>
    </dialog>
    )
})