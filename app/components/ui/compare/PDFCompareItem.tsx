import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageMode } from '~/routes/project.$id.detail.$list_id';
import { PAGE_MODE } from '~/routes/project.$id.detail.$list_id';
import { ListIcon, PDFMarkIcon } from '../Icons';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFBookPopover from './PDFBookPopover';
import { useFetcher } from '@remix-run/react';
import { CompareMode } from '~/routes/project.$id.compare.$list_id';
import type { CompareLoaderData } from '~/routes/project.$id.compare.$list_id';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

type Props = {
  books: Awaited<CompareLoaderData>['data']['books'];
  bookId: number;
  curPage: number;
  isPrev: boolean;
  mode: CompareMode;
  onNumPagesChange?: (pages: number) => void;
  onLoading?: (isLoading: boolean) => void;
};

// const PAGE_MODE = {
//   /** 旧 PDF 模式: 使用图片形式展示。不支持画线，只展示内容  */
//   LEGACY_PDF: 'LEGACY_PDF',
//   /** 新 PDF 模式: 使用 react-pdf 展示 PDF。支持画线（线条单独保存），标注。*/
//   PDF: 'PDF', // 新 PDF 模式
//   /** 图片模式: 使用图片形式展示。支持画线（保存在图片上），标注。*/
//   IMAGE: 'IMAGE',
// } as const;
// type PageMode = keyof typeof PAGE_MODE;

type MarkPoint = {
  date: string;
  index: number;
  key: string;
  markId?: number;
  mark_content?: string;
  name: string;
  page: number;
  x: number;
  y: number;
};

const NEW_PDF_EDITOR_SINCE = '2024-01-22';

export default function PDFCompareItem(props: Props) {
  const {
    books,
    curPage,
    isPrev,
    bookId: initialBookId,
    onNumPagesChange,
    mode,
    onLoading,
  } = props;

  const query = useFetcher();

  const [listVisible, setListVisible] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>(PAGE_MODE.IMAGE);

  function handleDocLoadSuccess({ numPages }: { numPages: number }) {
    onNumPagesChange && onNumPagesChange(numPages);
  }

  function queryBookData(id: number) {
    query.load('/api/project?loader=book&id=' + id);
  }

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (query.data?.book) {
      handleLoading(true);
      const { book } = query.data;
      console.log('book', book);
      // 初始化当前页面的模式
      let initialPageMode: PageMode = PAGE_MODE.PDF;
      if (book?.pdf_url) {
        // 新 PDF 渲染模式
        // 1. 有创建日期，且创建日期在 2024.1.22 之后的 book
        // 2. 只有 pdf_url，且第一页没有 img_url 的 book
        const firstPageImage = book?.pages.find((p) => p.page === 1)?.img_url;
        if (
          (book.created_at && new Date(book.created_at) > new Date(NEW_PDF_EDITOR_SINCE)) ||
          !firstPageImage
        ) {
          initialPageMode = PAGE_MODE.PDF;
        } else {
          initialPageMode = PAGE_MODE.LEGACY_PDF;
        }
      } else {
        // 图片模式：无 pdf_url
        initialPageMode = PAGE_MODE.IMAGE;
      }
      setPageMode(initialPageMode);
      // 这俩需要展示图片
      if (initialPageMode === PAGE_MODE.IMAGE || initialPageMode === PAGE_MODE.LEGACY_PDF) {
        onNumPagesChange && onNumPagesChange(book.pages.length);
        loadCurPageImage(1);
      }
    }
  }, [query.data?.book]);

  const [loading, setLoading] = useState(false);
  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
    onLoading && onLoading(isLoading);
  };

  /** 加载当前页面的图片（旧 PDF  or 图片模式） */
  const loadCurPageImage = (page: number) => {
    // 旧pdf or 图片，初始化内容为图片 img_url 内容
    const imageObj = query.data?.book?.pages.find((e) => e.page === page);
    // 回填图片内容
    if (imageObj?.img_url) {
      loadImage(imageObj.img_url, imageObj.updated_at)
        .then((image) => {
          const { width, height } = image;
          const ctx = initCanvas(width, height);
          if (!ctx) return;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          handleLoading(false);
        });
    } else {
      handleLoading(false);
    }
  };

  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flexContainerRef = useRef<HTMLDivElement>(null);

  function handlePageRenderSuccess() {
    handleLoading(false);
    // 获取 page 尺寸，并根据该尺寸初始化画布
    const pageCanvas = pageCanvasRef.current;
    if (!pageCanvas) return;
    const { width, height } = pageCanvas.style;
    const widthNum = parseInt(width.replace('px', ''), 10);
    const heightNum = parseInt(height.replace('px', ''), 10);
    // const scroller = docScrollRef.current;
    // if (scroller && scroller.offsetWidth < widthNum) {
    //   const newZoom = scroller.offsetWidth / widthNum - 0.05;
    //   setZoom(newZoom);
    //   resizeRef.current.style.height = heightNum * newZoom + 'px';
    // }
    const ctx = initCanvas(widthNum, heightNum);
    if (!ctx) return;
    const mark = query.data?.book?.marks.find((e) => e.page === curPage);
    // 有图片的话，执行初始化内容
    if (mark?.drawing) {
      loadImage(mark.drawing, mark.updated_at)
        .then((image) => {
          ctx.clearRect(0, 0, widthNum, heightNum);
          ctx.drawImage(image, 0, 0, widthNum, heightNum);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          handleLoading(false);
        });
    } else {
      handleLoading(false);
    }
  }

  /**
   * 根据宽高，初始化 canvas
   * @param width
   * @param height
   */
  const initCanvas = (width: number, height: number) => {
    const drawingCanvas = drawingCanvasRef.current;
    const canvasWrapper = canvasWrapperRef.current;
    if (!drawingCanvas || !canvasWrapper) return;
    drawingCanvas.width = width;
    drawingCanvas.height = height;
    flexContainerRef.current!.style.minWidth = width + 'px';
    // flexContainerRef.current!.style.minHeight = height + 'px';
    canvasWrapper.style.width = width + 'px';
    canvasWrapper.style.height = height + 'px';
    const ctx = drawingCanvas.getContext('2d');
    return ctx;
  };

  /**
   * 加载图片
   * @param url 图片地址
   * @param updateTime 图片更新时间
   */
  function loadImage(url: string, updateTime?: string | null): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        resolve(image);
      };
      image.onerror = (e) => {
        reject(e);
      };
      const hash = updateTime ? new Date(updateTime).getTime() : Date.now();
      // 图片有更新，才更改 hash 去获取最新图片
      image.src = url + '?' + hash;
    });
  }

  useEffect(() => {
    handleLoading(true);
    if (pageMode === PAGE_MODE.LEGACY_PDF || pageMode === PAGE_MODE.IMAGE) {
      loadCurPageImage(curPage);
    }
  }, [curPage]);

  useEffect(() => {
    // 如果有初始化 bookId，获取数据。
    if (initialBookId) {
      queryBookData(initialBookId);
    }
  }, []);

  const bookMarks = useMemo<MarkPoint[]>(() => {
    return (
      query.data?.book?.marks
        .map((mark) => {
          const marks = JSON.parse(mark.data || '[]') || [];
          return (marks as MarkPoint[]).map((m) => {
            return {
              ...m,
              markId: mark.id,
              page: mark.page,
              key: `${mark.page}-${m.index}`,
            };
          });
        })
        .flat() || []
    );
  }, [query.data?.book?.marks]);

  const curPageMarkPoints = useMemo(() => {
    return bookMarks.filter((p) => p.page === curPage);
  }, [curPage, bookMarks]);

  const listStyle = useMemo(() => {
    if (mode === CompareMode.HORIZONTAL) {
      return {
        top: '48px',
        left: isPrev ? '0' : '50vw',
      };
    }
    if (mode === CompareMode.VERTICAL) {
      return {
        top: isPrev ? '48px' : 'calc(50vh + 24px)',
        height: 'calc(50vh - 24px)',
      };
    }
  }, [isPrev, mode]);

  const footerStyle = useMemo(() => {
    if (mode === CompareMode.HORIZONTAL) {
      return {
        right: isPrev ? '50vw' : '0',
      };
    }
    if (mode === CompareMode.VERTICAL) {
      return {
        bottom: isPrev ? 'calc(50vh - 24px)' : '0',
        right: 0,
      };
    }
  }, [isPrev, mode]);

  return (
    <div className="relative">
      {listVisible && (
        <div
          className="fixed bg-white w-[200px] max-w-[40%] border-r text-sm z-30"
          style={listStyle}
        >
          <div className="h-10 border-b leading-10 text-center">
            {query.data?.book?.project_name}
          </div>
          <ul
            className="relative overflow-auto"
            style={{
              height: mode === CompareMode.HORIZONTAL ? 'calc(100vh - 88px)' : 'calc(50vh - 64px)',
            }}
          >
            {bookMarks.length > 0 ? (
              bookMarks.map((mark) => {
                return (
                  <li className="p-2 sm:p-4 border-b" key={mark.key} data-key={mark.key}>
                    <div className="flex items-center justify-around">
                      <div className="flex items-center flex-1">#{mark.key}</div>
                    </div>
                    <div className="mt-2">{mark.name}</div>
                    <div className="hidden sm:block mt-2 text-gray-500">{mark.date}</div>
                    <div className="mt-2">{mark.mark_content}</div>
                  </li>
                );
              })
            ) : (
              <div className="h-[120px] flex items-center justify-center text-gray-400">
                Empty data
              </div>
            )}
          </ul>
        </div>
      )}
      <div
        ref={flexContainerRef}
        className="flex justify-center items-center min-h-[calc(100vh-96px)] min-w-full  touch-none"
      >
        <div className="relative" ref={canvasWrapperRef}>
          {/* 画线/图片展示用 canvas */}
          <canvas
            ref={drawingCanvasRef}
            className={`absolute inset-0 z-[1] ${loading ? 'hidden' : ''}`}
          ></canvas>
          {!!drawingCanvasRef.current?.width &&
            !loading &&
            curPageMarkPoints.map((mark) => {
              return (
                <span
                  key={mark.key}
                  data-key={mark.key}
                  className="left-2 top-2 w-[25px] h-[25px] absolute overflow-hidden z-20"
                  style={{
                    left: mark.x + 'px',
                    top: mark.y + 'px',
                    visibility: mark.x < 0 || mark.y < 0 ? 'hidden' : 'visible',
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <PDFMarkIcon />
                      <label className="text-sm inset-0 absolute text-white text-center leading-6">
                        {mark.index}
                      </label>
                    </TooltipTrigger>
                    <TooltipContent className="z-20">
                      <div className="px-2 py-1 rounded-md bg-base-content/80 text-base-100 text-sm font-light">
                        {mark.mark_content}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </span>
              );
            })}

          {pageMode === PAGE_MODE.PDF && (
            <Document
              file={query.data?.book?.pdf_url}
              loading={null}
              onLoadSuccess={handleDocLoadSuccess}
              onLoadError={console.error}
            >
              <Page
                canvasRef={pageCanvasRef}
                loading={null}
                pageNumber={curPage}
                onRenderSuccess={handlePageRenderSuccess}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
          )}
        </div>
      </div>

      <div
        className="fixed bottom-0 z-10 bg-white flex items-center border-t border-l rounded-tl-lg overflow-hidden"
        style={footerStyle}
      >
        <div
          onClick={() => {
            setListVisible(!listVisible);
          }}
          className={`${
            listVisible ? 'bg-[#345CA0] text-white opacity-100' : 'opacity-60'
          } flex justify-center items-center h-12 px-5 cursor-pointer select-none hover:opacity-100 border-r mr-3`}
        >
          <ListIcon />
        </div>
        <div className="flex-1 flex justify-center items-center">
          <PDFBookPopover
            books={books}
            bookId={initialBookId}
            onSubmit={(v) => {
              queryBookData(v);
            }}
          />
        </div>
        <div></div>
      </div>
    </div>
  );
}
