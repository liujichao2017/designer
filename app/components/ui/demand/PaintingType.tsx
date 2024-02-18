import { range } from "~/utils/helpers";
import { t } from "i18next";
import { Dispatch, SetStateAction, useState } from "react";
import { useDemandState } from "~/utils/store";

type Params = {
  errors: Record<string, string> | undefined,
  setErrors: Dispatch<SetStateAction<Record<string, string> | undefined>>
}

export default ({ errors, setErrors }: Params) => {
  const [designOption, setDesignOption, setPrintOPtion] = useDemandState(state => [state.design, state.setDesignOption, state.setPrintOption])

  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.category')}</span>
          </div>
          <select
            className={`rounded-lg border ${errors?.category ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
            onChange={(e) => {
              setDesignOption({
                category: parseInt(e.target.value)
              })
              delete errors?.category
              setErrors(errors)
            }}>
            <option value={-1}>{t(`demand.category`)}</option>
            {[0, 1, 2, 3, 4, 5, 17].map((value, index) => {
              return (<option key={index} value={value}
                selected={value == designOption?.category}>{t(`demand.categoryItem.${value}`)}</option>)
            })}
          </select>
        </div>
        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.size')}</span>
          </div>
          <select
            className={`rounded-lg border ${errors?.size ? 'border-red-500' : 'border-[#E5E6EB]'} w-full h-10 px-2.5 mt-2.5`}
            onChange={(e) => {
              setDesignOption({
                size: parseInt(e.target.value)
              })
              setPrintOPtion({
                size: +e.target.value
              })
              delete errors?.size
              delete errors?.printSize
              setErrors(errors)
            }}>
            <option value={-1}>{t(`demand.size`)}</option>
            {range(11).map((value, index) => {
              return (<option key={index} value={value}
                selected={value == designOption?.size}>{t(`demand.sizeItem.${value}`)}</option>)
            })}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
        <div>
          <div>
            <span className="text-sm text-[#FF3D00]">*</span>
            <span className="text-sm ml-2.5">{t('demand.pages')}</span>
          </div>
          <div className="flex border border-[#E5E6EB] rounded-lg mt-2.5">
            <button
              className="w-10 h-10 border-r border-[#E5E6EB] flex justify-center items-center cursor-pointer"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                let size = designOption?.pages ? designOption?.pages : 1
                if (size <= 1) return
                setDesignOption({
                  pages: size - 1
                })
                setPrintOPtion({
                  pages: size - 1
                })
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <div className="flex-1">
              <input type="number" value={designOption?.pages ? designOption?.pages : ""} onChange={event => {
                setDesignOption({
                  pages: +event.currentTarget.value
                })
                setPrintOPtion({
                  pages: +event.currentTarget.value
                })
              }}
                className="h-10 text-center w-full outline-none" />
            </div>
            <button
              className="w-10 h-10 border-l border-[#E5E6EB] flex justify-center items-center cursor-pointer"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                let size = designOption?.pages ? designOption?.pages : 1
                setDesignOption({
                  pages: (size + 1)
                })
                setPrintOPtion({
                  pages: size + 1
                })
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}