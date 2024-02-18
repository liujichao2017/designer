// import { useTranslation } from "react-i18next"
import { CloudDownIcon } from '../Icons';

type Props = {
  onDownload: (withMarks: boolean) => void;
};

export const PDFDownloader = (props: Props) => {
  const { onDownload } = props;
  // const { i18n } = useTranslation()

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="cursor-point">
        <div className="flex justify-center items-center mx-2 cursor-pointer select-none opacity-60 hover:opacity-100">
          <CloudDownIcon />
        </div>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu px-2 shadow bg-base-100 rounded-sm w-36 gap-1"
      >
        <li key="download">
          <button className="btn btn-sm btn-ghost" onClick={() => onDownload(false)}>
            原版
          </button>
        </li>
      </ul>
    </div>
  );
};
