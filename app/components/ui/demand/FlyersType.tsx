import { range } from "~/utils/helpers";
import { t } from "i18next";
import { Dispatch, SetStateAction } from "react";
import { useDemandState } from "~/utils/store";

type Params = {
  errors: Record<string, string> | undefined,
  setErrors: Dispatch<SetStateAction<Record<string, string> | undefined>>
}

export default ({ errors, setErrors }: Params) => {
  const [designOption, setDesignOption, setPrintOption] = useDemandState(state => [state.design, state.setDesignOption, state.setPrintOption])

  return (<div className="mt-2.5">
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 mt-2.5">
      <div>
        <div>
          <span className="text-sm text-[#FF3D00]">*</span>
          <span className="text-sm ml-2.5">{t('demand.size')}</span>
        </div>
        <div className="mt-2.5">
          <select
            className={`rounded-lg border ${errors?.size ? 'border-red-500' : 'border-[#CFD0D8]'} w-full h-10 px-2.5`}
            onChange={(e) => {
              setDesignOption({
                size: parseInt(e.target.value)
              })
              setPrintOption({
                size: +e.target.value
              })
              delete errors?.printSize
              delete errors?.size
              setErrors(errors)
            }}>
            <option value={-1}>{t(`demand.size`)}</option>
            {
              range(10).map(val =>
                <option key={val} value={val} selected={val == designOption?.size}>{t(`demand.sizeItem.${val}`)}</option>
              )
            }
          </select>
        </div>
      </div>
      <div>
        <div>
          <span className="text-sm text-[#FF3D00]">*</span>
          <span className="text-sm ml-2.5">{t('demand.folding')}</span>
        </div>
        <div className="mt-2.5">
          <select
            className={`rounded-lg border ${errors?.foldingType ? 'border-red-500' : 'border-[#CFD0D8]'} w-full h-10 px-2.5`}
            onChange={(e) => {
              setDesignOption({
                foldingType: parseInt(e.target.value)
              })
              delete errors?.foldingType
              setErrors(errors)
            }}>
            <option value={-1}>{t(`demand.folding`)}</option>
            {range(10).map((value, index) => {
              return (<option key={index} value={value} selected={value == designOption?.foldingType}>{t(`demand.foldingItem.${value}`)}</option>)
            })}
          </select>
        </div>
      </div>
    </div>
  </div>)
}