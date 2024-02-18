import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { defer } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useRef, useEffect } from 'react';
import { useService } from '~/services/services.server';
import PDFPager from '~/components/ui/detail/PDFPager';
import AbsoluteLoading from '~/components/ui/AbsoluteLoading';
import PDFCompareItem from '~/components/ui/compare/PDFCompareItem';
import { ArrowLeftIcon } from '~/components/ui/Icons';
import { useTranslation } from 'react-i18next';

export const loader = async (args: LoaderArgs) => {
  // const user = await isAuthenticated(args);
  // if (!user) throw redirect('/auth/signin');

  const projectId = parseInt(args.params.id as string);
  const bookId = parseInt(args.params.list_id as string);

  return defer({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    books: await useService('project').getProject(projectId),
    projectId,
    bookId,
  });
};

export type CompareLoaderData = ReturnType<typeof loader>;

export const action = async (args: ActionArgs) => {};

export enum CompareMode {
  VERTICAL,
  HORIZONTAL,
}

export default function ProjectCompare() {
  const { books, bookId } = useLoaderData<CompareLoaderData>();

  const nav = useNavigate();
  const { t } = useTranslation();

  // 根据当前 book，默认获取上一个 book 作为比对。
  const curBookIndex = books.findIndex((book) => book.id === bookId);
  const prevBookIndex = Math.max(curBookIndex - 1, 0);
  const prevBookId = books[prevBookIndex].id;

  const [numPages, setNumPages] = useState(1);
  const [curPage, setCurPage] = useState(1);

  const [compareMode, setCompareMode] = useState<CompareMode>(CompareMode.HORIZONTAL);

  function handlePageChange(pageNum: number) {
    let pageNumFixed = pageNum;
    if (pageNum <= 0) pageNumFixed = 1;
    if (pageNum > numPages) pageNumFixed = numPages;
    setCurPage(pageNumFixed);
  }

  const [prevLoading, setPrevLoading] = useState(false);
  const [currLoading, setCurrLoading] = useState(false);

  const prevContainerRef = useRef<HTMLDivElement>(null);
  const currContainerRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);
  const labelRef = useRef<HTMLLabelElement>(null);

  const handleScrollPrev = (event: Event) => {
    const { scrollTop, scrollLeft } = event.target as HTMLDivElement;
    const curr = currContainerRef.current;

    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        curr?.scrollTo({ top: scrollTop, left: scrollLeft });
        ticking.current = false;
      });
      ticking.current = true;
    }
  };

  const handleScrollCurr = (event: Event) => {
    const { scrollTop, scrollLeft } = event.target as HTMLDivElement;

    const prev = currContainerRef.current;
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        prev?.scrollTo({ top: scrollTop, left: scrollLeft });
        ticking.current = false;
      });
      ticking.current = true;
    }
  };

  const chooseMode = (mode: CompareMode) => {
    setCompareMode(mode);
    // hack to close dropdown when item chose
    const elem = document.activeElement as HTMLButtonElement;
    elem?.blur();
  };

  useEffect(() => {
    const prev = prevContainerRef.current;
    const curr = currContainerRef.current;
    prev?.addEventListener('scroll', handleScrollPrev);
    curr?.addEventListener('scroll', handleScrollCurr);
    return () => {
      prev?.removeEventListener('scroll', handleScrollPrev);
      curr?.addEventListener('scroll', handleScrollCurr);
    };
  }, []);

  const renderCompareItems = (mode: CompareMode) => {
    if (mode === CompareMode.HORIZONTAL) {
      return (
        <div className="grid grid-cols-2">
          <div
            ref={prevContainerRef}
            className="relative h-[calc(100vh-48px)] normal-scrollbar w-[50vw] overflow-auto box-border border-r bg-slate-100"
          >
            {prevLoading && <AbsoluteLoading />}
            <PDFCompareItem
              mode={CompareMode.HORIZONTAL}
              isPrev={true}
              books={books}
              bookId={prevBookId}
              onLoading={setPrevLoading}
              curPage={curPage}
            />
          </div>
          <div
            ref={currContainerRef}
            className="relative h-[calc(100vh-48px)] normal-scrollbar w-[50vw] overflow-auto box-border bg-slate-100"
          >
            {currLoading && <AbsoluteLoading />}
            <PDFCompareItem
              isPrev={false}
              mode={CompareMode.HORIZONTAL}
              books={books}
              bookId={bookId}
              onLoading={setCurrLoading}
              curPage={curPage}
              onNumPagesChange={setNumPages}
            />
          </div>
        </div>
      );
    } else if (mode === CompareMode.VERTICAL) {
      return (
        <div className="grid grid-rows-2">
          <div
            ref={prevContainerRef}
            className="relative normal-scrollbar h-[calc(50vh-24px)] overflow-auto box-border border-b bg-slate-100"
          >
            {prevLoading && <AbsoluteLoading />}
            <PDFCompareItem
              mode={CompareMode.VERTICAL}
              isPrev={true}
              books={books}
              onLoading={setPrevLoading}
              bookId={prevBookId}
              curPage={curPage}
            />
          </div>
          <div
            ref={currContainerRef}
            className="relative normal-scrollbar h-[calc(50vh-24px)] overflow-auto box-border bg-slate-100"
          >
            {currLoading && <AbsoluteLoading />}
            <PDFCompareItem
              isPrev={false}
              mode={CompareMode.VERTICAL}
              books={books}
              bookId={bookId}
              onLoading={setCurrLoading}
              curPage={curPage}
              onNumPagesChange={setNumPages}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border border-solid border-l-0 border-r-0 border-t-0 border-[#E6E6E6] flex justify-between items-center h-12 bg-white z-10">
        <span
          onClick={() => nav(-1)}
          className="flex gap-1 items-center cursor-pointer font-medium text-lg pl-3"
        >
          <ArrowLeftIcon />
          {t('demand.back')}
        </span>
        <PDFPager
          disabled={currLoading || prevLoading}
          curPage={curPage}
          numPages={numPages}
          onPageChange={handlePageChange}
        />
        <div className="dropdown dropdown-end">
          <label ref={labelRef} tabIndex={0} className="cursor-point">
            <button className="btn btn-primary btn-sm mr-4">
              {compareMode === CompareMode.VERTICAL ? 'Vertical' : 'Horizontal'}
            </button>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu px-2 shadow bg-base-100 rounded-sm w-36 gap-1"
          >
            <li key="vertical">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => chooseMode(CompareMode.VERTICAL)}
              >
                Vertical
              </button>
            </li>
            <li key="horizontal">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => chooseMode(CompareMode.HORIZONTAL)}
              >
                Horizontal
              </button>
            </li>
          </ul>
        </div>
      </div>

      {renderCompareItems(compareMode)}
    </div>
  );
}
