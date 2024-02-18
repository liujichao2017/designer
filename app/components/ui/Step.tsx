type Props = {
  active: number
  steps: string[]
}

export function SimpleStep ({ steps, active }: Props) {
  return (
    <div className="flex justify-center">
      {steps.map((step, index) => {
        return (<div key={index} className="flex items-center">
          {index < active ? (<div
            className={`w-10 h-10 rounded-full border border-[#000000] flex items-center justify-center ${index == 0 ? '' : 'ml-5'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 15" fill="none">
              <path
                d="M7.72674 14C7.37308 14 7.02083 13.8586 6.75105 13.5774L1.23102 7.79946C0.692851 7.23551 0.692851 6.32037 1.23102 5.75642C1.77058 5.19247 2.64422 5.19247 3.18239 5.75642L7.72674 10.5128L16.4101 1.42406C16.9482 0.858648 17.8219 0.858648 18.3614 1.42406C18.8996 1.98801 18.8996 2.90169 18.3614 3.46564L8.70242 13.5774C8.43264 13.8586 8.07899 14 7.72674 14Z"
                fill="#222222" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>) : (
            <div
              className={`w-10 h-10 ${index == active ? 'bg-[#3251D5] text-white' : 'bg-[#F6F7F8]'} rounded-full flex items-center justify-center ${index == 0 ? '' : 'ml-5'}`}>{index + 1}</div>)}
          <div className={`ml-5 ${index == active ? 'text-[#3251D5]' : ''}`}>{step}</div>
          {index + 1 == 4 ? '' : (
            <div className="border-dashed border-b-2 border-[#969696] w-16 ml-5"></div>)}
        </div>)
      })}
    </div>
  )
}

export function TotalStep ({ steps, active }: Props) {
  return (
    <div className="flex w-[58rem] text-center justify-center gap-14">
      {
        steps.map((step, index) =>
          <div key={step}
            className={`py-3 w-1/${steps.length} text-center flex gap-2 items-center justify-center`}>
            <span
              className={`rounded-full border flex h-10 w-10 justify-center items-center font-semibold ${index === active ? "bg-primary border-base-200 text-base-100" : "bg-base-100 border-base-300"}`}
            >
              {index + 1}
            </span>
            <span className="font-bold">
              {step}
            </span>
            {
              // index != steps.length - 1 &&
              // <span className="border-b w-1/6 border-dashed border-base-content/60"></span>
            }

          </div>
        )

      }
    </div>
  )
}
