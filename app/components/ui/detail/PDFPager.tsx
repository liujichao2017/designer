import { ArrowLeftIcon, ArrowRightIcon } from '../Icons';

type Props = {
  curPage: number;
  numPages: number;
  disabled: boolean;
  onPageChange: (newPage: number) => void;
};

export default function PDFPager(props: Props) {
  const { curPage, numPages, disabled, onPageChange } = props;

  const handlePageChange = (newPage: number) => {
    if (disabled) {
      return;
    }

    onPageChange(newPage);
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`flex items-center h-16 select-none opacity-60 hover:opacity-100
        ${disabled ? 'cursor-not-allowed hover:opacity-60' : 'cursor-pointer'}
        `}
        onClick={() => handlePageChange(curPage - 1)}
      >
        <ArrowLeftIcon />
      </div>
      <div className="flex items-center cursor-pointer mx-5">
        <input
          type="number"
          value={curPage}
          className="w-12 h-8 rounded-lg px-2.5 border border-solid border-[#e6e6e6] text-center flex-1"
          onChange={(e) => {
            handlePageChange(parseInt(e.target.value || '0'));
          }}
        />
        <div>&nbsp;&nbsp;/&nbsp;&nbsp;{numPages}</div>
      </div>
      <div
        className={`flex items-center h-16 select-none opacity-60 hover:opacity-100
        ${disabled ? 'cursor-not-allowed hover:opacity-60' : 'cursor-pointer'}
        `}
        onClick={() => handlePageChange(curPage + 1)}
      >
        <ArrowRightIcon />
      </div>
    </div>
  );
}
