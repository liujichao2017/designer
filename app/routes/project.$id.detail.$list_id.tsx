//@ts-nocheck
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { defer, json } from '@remix-run/node';
import { useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  EditorIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MessageIcon,
  PDFMarkIcon,
  QuestionIcon,
  ListIcon,
  SaveIcon,
} from '@/components/ui/Icons';
import AbsoluteLoading from '~/components/ui/AbsoluteLoading';
import ShareLinkDialog from '~/components/form/ShareLinkDialog';
import { z } from 'zod';
import { useService } from '~/services/services.server';
// import { isAuthenticated } from '~/utils/sessions.server';
import { useTranslation } from 'react-i18next';
import { ResultCode, fault } from '~/utils/result';
import { useToast } from '~/components/ui/use-toast';
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import dayjs from 'dayjs';
import interact from 'interactjs';
import { Document, Page, pdfjs } from 'react-pdf';
import { PopoverColorPicker } from '~/components/ui/PopoverColorPicker';
import PDFPager from '~/components/ui/detail/PDFPager';
import helpImage from '~/images/help.gif';
import { PDFDownloader } from '~/components/ui/detail/PDFDownloader';
import PDFMarkPopover from '~/components/ui/detail/PDFMarkPopover';
import type { Interactable } from '@interactjs/types/index';
import { flushSync } from 'react-dom';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.legacy.min.js';

export const loader = async (args: LoaderArgs) => {
  // const user = await isAuthenticated(args);
  // if (!user) throw redirect('/auth/signin');

  const projectId = parseInt(args.params.id as string);
  const bookId = parseInt(args.params.list_id as string);
  return defer({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    book: await useService('projectList').getById(bookId),
    v1Url: process.env.V1_END_POINT,
    projectId,
    bookId,
  });
};

type LoaderData = ReturnType<typeof loader>;

export const ContentValidator = z.object({
  content: z.string().min(1),
});

export const action = async (args: ActionArgs) => {
  // const user = await isAuthenticated(args);
  // if (!user) throw redirect('/auth/signin');

  const projectId = parseInt(args.params.id as string);
  const bookId = parseInt(args.params.list_id as string);
  const form: z.infer<typeof ContentValidator> & { _action: string } = await args.request.json();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const markService = useService('projectMark');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const imageService = useService('projectListImage');
  switch (form._action) {
    case 'delete_mark_point': {
      const { marks, markId } = form;
      await markService.updateMarksById(markId, JSON.stringify(marks));
      return json({ code: ResultCode.OK });
    }
    case 'update_mark_point_content': {
      const result = await ContentValidator.safeParseAsync(form);
      if (!result.success) {
        return fault(ResultCode.FORM_INVALID);
      }
      const { content, index, marks, markId, page } = form;
      const newMarks = marks.map((p) => {
        if (p.index === index) return { ...p, mark_content: content };
        return p;
      });
      const payload = { marks: JSON.stringify(newMarks) };
      if (markId) {
        await markService.updateById(markId, payload);
        return json({ code: ResultCode.OK });
      } else {
        await markService.create(bookId, projectId, 0, page, payload);
        return json({ code: ResultCode.OK });
      }
    }
    case 'handle_mark_record': {
      const { drawing, markId, marks, page } = form;
      if (markId) {
        await markService.updateById(markId, { drawing, marks });
        return json({ code: ResultCode.OK });
      } else {
        await markService.create(bookId, projectId, 0, page, { drawing, marks });
        return json({ code: ResultCode.OK });
      }
    }
    // 图片类型单独更新
    case 'update_image': {
      const { drawing, imageId } = form;
      if (imageId) {
        await imageService.updateById(imageId, drawing);
        return json({ code: ResultCode.OK });
      }
    }
  }
};

const EDIT_MODE = {
  NONE: 'NONE', // 无模式，浏览
  DRAW: 'DRAW', // 画线模式
  MARK: 'MARK', // 标注模式
} as const;
type EditModel = keyof typeof EDIT_MODE;
type Position = { x: number; y: number };

export const PAGE_MODE = {
  /** 旧 PDF 模式: 使用图片形式展示。不支持画线，只展示内容  */
  LEGACY_PDF: 'LEGACY_PDF',
  /** 新 PDF 模式: 使用 react-pdf 展示 PDF。支持画线（线条单独保存），标注。*/
  PDF: 'PDF', // 新 PDF 模式
  /** 图片模式: 使用图片形式展示。支持画线（保存在图片上），标注。*/
  IMAGE: 'IMAGE',
} as const;
export type PageMode = keyof typeof PAGE_MODE;

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

export default function ProjectDetail() {
  const { book, projectId, bookId } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const query = useFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState<EditModel>(EDIT_MODE.NONE);
  const [pageMode, setPageMode] = useState<PageMode>(PAGE_MODE.IMAGE);
  const [markListVisible, setMarkListVisible] = useState(true);
  const [markPoints, setMarkPoints] = useState<MarkPoint[]>([]);
  const [numPages, setNumPages] = useState(1);
  const [curPage, setCurPage] = useState(1);
  const [color, setColor] = useState('#FF0000');

  useEffect(() => {
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
    setLoading(true);
    // 这俩需要展示图片
    if (initialPageMode === PAGE_MODE.IMAGE || initialPageMode === PAGE_MODE.LEGACY_PDF) {
      setNumPages(book?.pages.length);
      loadCurPageImage(1);
    }
  }, []);

  const isMobileDevice = () => {
    const userAgent = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  };

  const [interactable, setInteractable] = useState<Interactable>();
  const compatibleMobile = () => {
    const resizer = resizeRef.current;
    if (!resizer) return;
    let scale = zoom;
    if (isMobileDevice()) {
      const result = interact(resizer)
        .gesturable({
          listeners: {
            move(event) {
              event.stopPropagation();
              event.preventDefault();
              const newZoom = scale * event.scale;
              canvasWrapperRef.current!.style.transform = 'scale(' + newZoom + ')';
              dragMoveListener(event);
            },
            end(event) {
              event.stopPropagation();
              event.preventDefault();
              scale = scale * event.scale;
              setZoom(scale);
            },
          },
        })
        .draggable({
          listeners: { move: dragMoveListener },
        });
      setInteractable(result);
    } else {
      if (interactable) {
        interact(resizer).unset();
      }
    }
  };

  const dragMoveListener = (event) => {
    event.stopPropagation();
    event.preventDefault();
    let target = event.target;
    let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  };

  const [loading, setLoading] = useState(false);
  /** 加载当前页面的图片（旧 PDF  or 图片模式） */
  const loadCurPageImage = (page: number) => {
    // 旧pdf or 图片，初始化内容为图片 img_url 内容
    const imageObj = book?.pages.find((e) => e.page === page);
    // 回填图片内容
    if (imageObj?.img_url) {
      setLoading(true);
      loadImage(imageObj.img_url, imageObj.updated_at)
        .then((image) => {
          const { width, height } = image;
          const ctx = initCanvas(width, height);
          if (!ctx) return;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          setInitImageData(imageData);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [initImageData, setInitImageData] = useState<ImageData | null>(null);

  function handleDocLoadSuccess({ numPages }: { numPages: number }) {
    setLoading(false);
    setNumPages(numPages);
  }
  function handlePageRenderSuccess() {
    // 获取 page 尺寸，并根据该尺寸初始化画布
    const pageCanvas = pageCanvasRef.current;
    if (!pageCanvas) return;
    const { width, height } = pageCanvas.style;
    const widthNum = parseInt(width.replace('px', ''), 10);
    const heightNum = parseInt(height.replace('px', ''), 10);
    const scroller = docScrollRef.current;
    if (scroller && scroller.offsetWidth < widthNum) {
      const newZoom = scroller.offsetWidth / widthNum - 0.05;
      setZoom(newZoom);
    }
    const ctx = initCanvas(widthNum, heightNum);
    if (!ctx) return;
    const mark = book?.marks.find((e) => e.page === curPage);
    // 有图片的话，执行初始化内容
    if (mark?.drawing) {
      setLoading(true);
      loadImage(mark.drawing, mark.updated_at)
        .then((image) => {
          ctx.clearRect(0, 0, widthNum, heightNum);
          ctx.drawImage(image, 0, 0, widthNum, heightNum);
          const imageData = ctx.getImageData(0, 0, widthNum, heightNum);
          setInitImageData(imageData);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }

  function handlePageChange(pageNum: number) {
    let pageNumFixed = pageNum;
    if (pageNum <= 0) pageNumFixed = 1;
    if (pageNum > numPages) pageNumFixed = numPages;
    setCurPage(pageNumFixed);
    if (pageMode === PAGE_MODE.LEGACY_PDF || pageMode === PAGE_MODE.IMAGE) {
      loadCurPageImage(pageNumFixed);
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

  function handleEditModeChange(nextMode: EditModel) {
    if (editMode === nextMode) {
      setEditMode(EDIT_MODE.NONE);
      return;
    }
    setEditMode(nextMode);
  }

  function handleCompare() {
    navigate(`/project/${projectId}/compare/${bookId}`);
  }

  function handleShowHelpModal() {
    (window as any).editorHelpDialog?.showModal();
  }

  const handleDownload = useCallback(
    (withMarks: boolean) => {
      if (withMarks) {
        // TODO 下载带 mark 的pdf
      } else {
        book?.pdf_url && window.open(book?.pdf_url, '_blank');
      }
    },
    [book?.pdf_url],
  );

  const [zoom, setZoom] = useState(1);
  function handleZoom(isZoomOut: boolean) {
    const offset = 0.1;
    const newZoom = isZoomOut ? zoom - offset : zoom + offset;
    setZoom(newZoom);
  }

  const [drawing, setDrawing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<Position>({ x: 0, y: 0 });
  const [drawHistory, setDrawHistory] = useState<any[]>([]);
  // 当前操作步骤，在 drawHistory 中的索引
  const [step, setStep] = useState(-1);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleSaveDrawing() {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const drawing = drawingCanvas.toDataURL('image/png', 1);
    // 判断是否图片类型
    if (pageMode === PAGE_MODE.PDF) {
      fetcher.submit(
        {
          _action: 'handle_mark_record',
          drawing,
          page: curPage,
          markId: curProjectMarkId,
        },
        { method: 'post', encType: 'application/json' },
      );
    } else {
      fetcher.submit(
        {
          _action: 'update_image',
          drawing,
          // page: curPage,
          imageId: curImageId,
        },
        { method: 'post', encType: 'application/json' },
      );
    }
  }

  const handleShare = () => {
    query.load('/api/share?_loader=project&id=' + projectId);
    (window as any)?.shareLinkDialog?.showModal();
  };

  const getCanvasMousePosition = (clientX: number, clientY: number, offset: number) => {
    if (!drawingCanvasRef.current) return { x: 0, y: 0 };
    let canvasPosition = drawingCanvasRef.current.getBoundingClientRect();
    let x = (clientX - canvasPosition.x) / zoom;
    let y = (clientY - canvasPosition.y) / zoom;
    if (offset > 0) y -= offset;
    return { x, y };
  };

  function onDrawingCanvasMouseDown(event: React.MouseEvent) {
    const { x, y } = getCanvasMousePosition(event.clientX, event.clientY, 0);
    setCursorPosition({ x, y });
    setDrawing(true);
  }

  function onDrawingCanvasMouseUp(event: React.MouseEvent) {
    const { x, y } = getCanvasMousePosition(event.clientX, event.clientY, 25);
    setDrawing(false);
    if (editMode === EDIT_MODE.DRAW) {
      const drawingCanvas = drawingCanvasRef.current;
      if (!drawingCanvas) return;
      const { width, height } = drawingCanvas;
      const line = drawingCanvas.getContext('2d')?.getImageData(0, 0, width, height);
      const newHistory = [...drawHistory.filter((_, i) => i <= step), line];
      setDrawHistory(newHistory);
      // 操作完成后，将当前索引指向最后一步
      setStep(newHistory.length - 1);
    }
    if (editMode === EDIT_MODE.MARK) {
      const nextIndex = markPoints?.length ? Math.max(...markPoints.map((p) => p.index)) + 1 : 1;
      const newMarkPoints = [
        ...markPoints,
        {
          key: `${curPage}-${nextIndex}`,
          page: curPage,
          index: nextIndex,
          name: '',
          date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          x,
          y,
        },
      ];
      setMarkPoints(newMarkPoints);
      handleMarkPopoverShow(nextIndex, markContent || '');
    }
  }

  function onDrawingCanvasMouseMove(event: React.MouseEvent) {
    if (editMode === EDIT_MODE.DRAW && drawing) {
      const { x, y } = getCanvasMousePosition(event.clientX, event.clientY, 0);
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.moveTo(cursorPosition.x, cursorPosition.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      setCursorPosition({ x, y });
    }
  }

  const handleUndo = () => {
    const drawingCanvas = drawingCanvasRef.current;
    const ctx = drawingCanvas?.getContext('2d');
    if (!drawingCanvas || !ctx) return;
    if (step >= 0) {
      const newStep = step - 1;
      if (newStep < 0) {
        if (initImageData) {
          ctx.putImageData(initImageData, 0, 0);
        } else {
          ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        }
      } else {
        ctx.putImageData(drawHistory[newStep], 0, 0);
      }
      setStep(newStep);
    }
  };

  const handleRedo = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    if (step < drawHistory.length - 1) {
      const newStep = step + 1;
      drawingCanvas.getContext('2d')?.putImageData(drawHistory[newStep], 0, 0);
      setStep(newStep);
    }
  };

  const deletingMarkIndex = useRef(0);
  const handleShowDeleteModal = (index: number) => {
    deletingMarkIndex.current = index;
    (window as any)?.deleteDialog?.showModal();
  };
  function handleDeleteMark() {
    const newMarkPoints = markPoints.filter(
      (p) => p.page === curPage && p.index !== deletingMarkIndex.current,
    );
    fetcher.submit(
      {
        _action: 'delete_mark_point',
        markId: curProjectMarkId,
        marks: newMarkPoints,
      },
      { method: 'post', encType: 'application/json' },
    );
  }

  const docScrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  function handleMarkItemClick(mark: MarkPoint) {
    const { page, index } = mark;
    flushSync(() => {
      if (page !== curPage) {
        setCurPage(page);
        if (pageMode === PAGE_MODE.LEGACY_PDF || pageMode === PAGE_MODE.IMAGE) {
          loadCurPageImage(page);
        }
      }
    });
    const curMarkPoint = markPoints.find((p) => p.page === page && p.index === index);
    if (!curMarkPoint) return;
    const { x, y } = curMarkPoint;
    const docScroll = docScrollRef.current;
    if (!docScroll || x < 0 || y < 0) return;
    const targetDom = docScroll.querySelector(`span[data-key="${page}-${index}"]`);
    if (!targetDom) return;
    const activeClass = 'fill-[#314EDD]';
    let spanList = docScroll.querySelectorAll('span');
    if (spanList) {
      targetDom.querySelector('svg')?.classList.add(activeClass);
      setTimeout(() => {
        targetDom.querySelector('svg')?.classList.remove(activeClass);
      }, 1500);
    }
    if (!isMobileDevice()) {
      // 移动端没有滚动条
      const { left, top } = (targetDom as HTMLSpanElement).style;
      let drawPosition = docScroll.getBoundingClientRect();
      const targetLeft = Number(left.replace('px', ''));
      const targetTop = Number(top.replace('px', ''));
      const diffLeft = Math.max(targetLeft * zoom - drawPosition.width / 2, 0);
      const diffTop = Math.max(targetTop * zoom - drawPosition.height / 2, 0);
      docScroll.scrollTo({
        left: diffLeft,
        top: diffTop,
        behavior: 'smooth',
      });
    }
  }

  const markListULRef = useRef<HTMLUListElement>(null);
  function handleMarkPointClick(page: number, index: number) {
    const ulDom = markListULRef.current;
    if (!ulDom) return;
    let liList = ulDom.querySelectorAll('li');
    const targetLi = ulDom.querySelector(`li[data-key="${page}-${index}"]`);
    if (!targetLi) return; // 找不到 dom 返回
    ulDom.scrollTo({
      top: (targetLi as HTMLElement).offsetTop,
      behavior: 'smooth',
    });
    const activeClass = 'bg-blue-100';
    for (let i = 0; i < liList.length; i++) {
      liList[i].classList.remove(activeClass);
    }
    targetLi.classList.add(activeClass);
  }

  const [editingIndex, setEditingIndex] = useState(0);
  const [popOpen, setPopOpen] = useState(false);
  const [markContent, setMarkContent] = useState('');
  function handleMarkPopoverShow(index: number, content?: string) {
    setEditingIndex(index);
    setMarkContent(content || '');
    setPopOpen(true);
  }
  function handleMarkPopoverCancel() {
    setEditingIndex(-1);
    setMarkPoints(markPoints.filter((p) => !!p.mark_content));
    setPopOpen(false);
  }
  function handleMarkPopoverSubmit() {
    if (!markContent) {
      toast({
        description: 'Please enter detailed information',
      });
      return;
    }
    setEditingIndex(-1);
    fetcher.submit(
      {
        _action: 'update_mark_point_content',
        content: markContent,
        markId: curProjectMarkId,
        marks: curPageMarkPoints,
        index: editingIndex,
        page: curPage,
      },
      { method: 'post', encType: 'application/json' },
    );
    setMarkContent('');
  }

  const curPageMarkPoints = useMemo(() => {
    return markPoints.filter((p) => p.page === curPage);
  }, [curPage, markPoints]);

  const curProjectMarkId = useMemo(() => {
    return book?.marks.find((m) => m.page === curPage)?.id;
  }, [book?.marks, curPage]);

  const curImageId = useMemo(() => {
    return book?.pages.find((m) => m.page === curPage)?.id;
  }, [book?.pages, curPage]);

  const initialMarks = useMemo<MarkPoint[]>(() => {
    return (
      book?.marks
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
  }, [book?.marks]);

  const shouldShowMarkPoints =
    (pageMode === PAGE_MODE.PDF && !!pageCanvasRef.current) ||
    (pageMode !== PAGE_MODE.PDF && !!drawingCanvasRef.current?.width);

  useEffect(() => {
    setMarkPoints(initialMarks);
  }, [initialMarks]);

  useEffect(() => {
    const handleUnloadPage = (e: BeforeUnloadEvent) => {
      e.returnValue = '确定离开当前页面？';
    };
    // 有画线才提示要不要离开
    if (drawHistory.length > 0) {
      window.addEventListener('beforeunload', handleUnloadPage);
    }

    return () => {
      window.removeEventListener('beforeunload', handleUnloadPage);
    };
  }, [drawHistory.length]);

  useEffect(() => {
    compatibleMobile();
    window.addEventListener('resize', compatibleMobile);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="border border-solid border-l-0 border-r-0 border-t-0 border-[#E6E6E6] flex justify-between items-center h-12 bg-white z-10">
        <div></div>
        <PDFPager
          disabled={loading}
          curPage={curPage}
          numPages={numPages}
          onPageChange={handlePageChange}
        />
        {/* <button
          className="btn btn-primary btn-sm mr-3"
          onClick={() => {
            setShowAll(!showAll);
          }}
        >
          Show all
        </button> */}
        <button className="btn btn-primary btn-sm mr-3" onClick={handleShare}>
          Share
        </button>
      </div>
      <div
        onClick={handleCompare}
        className="hidden sm:block z-10 text-sm border-1 fixed right-8 bottom-8 bg-white rounded-lg px-4 
        py-1.5 cursor-pointer shadow-md"
      >
        Compare
      </div>
      <div className="h-12 flex items-center border-b">
        <div className="flex flex-1 items-center">
          <div
            onClick={() => {
              setMarkListVisible(!markListVisible);
            }}
            className={`${
              markListVisible ? 'bg-[#345CA0] text-white opacity-100' : 'opacity-60'
            } flex justify-center items-center h-12 px-5 cursor-pointer select-none hover:opacity-100`}
          >
            <ListIcon />
          </div>
          <div className="hidden sm:flex justify-center items-center h-12 px-5 cursor-pointer select-none">
            <PopoverColorPicker color={color} onChange={setColor} />
          </div>
          <div
            onClick={() => handleEditModeChange(EDIT_MODE.DRAW)}
            className={`${
              editMode === EDIT_MODE.DRAW ? 'bg-[#345CA0] text-white opacity-100' : 'opacity-60'
            } hidden sm:flex justify-center items-center h-12 px-5 cursor-pointer select-none hover:opacity-100`}
          >
            <EditorIcon />
          </div>
          <div
            onClick={() => handleEditModeChange(EDIT_MODE.MARK)}
            className={`${
              editMode === EDIT_MODE.MARK ? 'bg-[#345CA0] text-white opacity-100' : 'opacity-60'
            } flex justify-center items-center h-12 px-5 cursor-pointer select-none hover:opacity-100`}
          >
            <MessageIcon />
          </div>
          <div
            onClick={handleUndo}
            className="hidden sm:flex justify-center items-center h-12 px-5 cursor-pointer select-none opacity-60 hover:opacity-100"
          >
            <ArrowLeftIcon />
          </div>
          <div
            onClick={handleRedo}
            className="hidden sm:flex justify-center items-center h-12 px-5 cursor-pointer select-none opacity-60 hover:opacity-100"
          >
            <ArrowRightIcon />
          </div>
          <div
            onClick={() => handleZoom(true)}
            className="hidden sm:flex justify-center items-center h-12 px-5 cursor-pointer select-none opacity-60 hover:opacity-100"
          >
            <ZoomOutIcon />
          </div>
          <div
            onClick={() => handleZoom(false)}
            className="hidden sm:flex justify-center items-center h-12 px-5 cursor-pointer select-none opacity-60 hover:opacity-100"
          >
            <ZoomInIcon />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div
            onClick={handleSaveDrawing}
            className="hidden sm:flex relative justify-center items-center mx-2 cursor-pointer select-none"
          >
            <span className="opacity-60 hover:opacity-100">
              <SaveIcon />
            </span>
            <span
              className="absolute w-2 h-2 rounded-full bg-red-500 right-0 top-0"
              style={{ display: drawHistory.length > 0 ? 'block' : 'none' }}
            ></span>
          </div>
          {!!book?.pdf_url && <PDFDownloader onDownload={handleDownload} />}
          <div
            onClick={handleShowHelpModal}
            className="flex justify-center items-center mx-2 cursor-pointer select-none opacity-60 hover:opacity-100"
          >
            <QuestionIcon />
          </div>
        </div>
      </div>

      <div className="flex-1 justify-center items-center">
        <div className="flex flex-wrap relative">
          {markListVisible && (
            <div className="absolute left-0 top-0 bg-white z-10 sm:static w-[290px] max-w-[40%] border-r text-sm">
              <div className="h-10 border-b leading-10 text-center">{book?.project_name}</div>

              <ul className="h-[calc(100vh-136px)] relative overflow-auto" ref={markListULRef}>
                {initialMarks.length > 0 ? (
                  initialMarks.map((mark) => {
                    return (
                      <li
                        className="p-2 sm:p-4 border-b   hover:bg-blue-50 cursor-pointer"
                        key={mark.key}
                        data-key={mark.key}
                        onClick={() => handleMarkItemClick(mark)}
                      >
                        <div className="flex items-center justify-around">
                          <div className="flex items-center flex-1">
                            #{mark.key}
                            {/* <div
                              className={` 
                                    w-2 h-2 ml-2 rounded-full
                                    ${mark.x > 0 && mark.y > 0 ? 'bg-red-500' : 'bg-blue-800'}`}
                            ></div> */}
                          </div>
                          <div
                            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-white"
                            onClick={() => handleMarkPopoverShow(mark.index, mark.mark_content)}
                          >
                            <Pencil2Icon />
                          </div>
                          <div
                            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-white"
                            onClick={() => handleShowDeleteModal(mark.index)}
                          >
                            <TrashIcon />
                          </div>
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
            className="relative normal-scrollbar flex-1 bg-slate-100 h-[calc(100vh-96px)] overflow-auto"
            ref={docScrollRef}
          >
            {loading && <AbsoluteLoading />}
            <div
              ref={resizeRef}
              className="flex justify-center items-center
              min-h-[calc(100vh-96px)] min-w-full touch-none
              "
              style={
                drawingCanvasRef.current && !interactable
                  ? {
                      width: drawingCanvasRef.current.width * zoom + 'px',
                      height: drawingCanvasRef.current.height * zoom + 'px',
                    }
                  : {}
              }
            >
              <div
                className="relative"
                ref={canvasWrapperRef}
                style={{
                  transform: `scale(${zoom})`,
                }}
              >
                {/* 画线/图片展示用 canvas */}
                <canvas
                  ref={drawingCanvasRef}
                  onMouseDownCapture={onDrawingCanvasMouseDown}
                  onMouseUpCapture={onDrawingCanvasMouseUp}
                  onMouseMoveCapture={onDrawingCanvasMouseMove}
                  className="absolute inset-0 z-[1]"
                ></canvas>
                {/* 初始化 canvas 层后展示 markPoints */}

                {shouldShowMarkPoints &&
                  curPageMarkPoints.map((mark) => {
                    // if (mark.index === editingIndex) {
                    return (
                      <PDFMarkPopover
                        key={mark.key}
                        content={markContent}
                        opened={popOpen && mark.index === editingIndex}
                        onChange={(value) => {
                          setMarkContent(value);
                        }}
                        onCancel={handleMarkPopoverCancel}
                        onSubmit={handleMarkPopoverSubmit}
                      >
                        <span
                          key={mark.key}
                          data-key={mark.key}
                          className="transi left-2 top-2 w-[25px] h-[25px] absolute overflow-hidden z-20"
                          style={{
                            left: mark.x + 'px',
                            top: mark.y + 'px',
                            visibility: mark.x < 0 || mark.y < 0 ? 'hidden' : 'visible',
                          }}
                        >
                          <PDFMarkIcon />
                          <label
                            className="text-sm inset-0 absolute text-white text-center cursor-pointer leading-6"
                            onClick={() => handleMarkPointClick(mark.page, mark.index)}
                          >
                            {mark.index}
                          </label>
                        </span>
                      </PDFMarkPopover>
                    );
                  })}

                {pageMode === PAGE_MODE.PDF && (
                  <Document
                    file={book.pdf_url}
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
                      renderTextLayer={editMode === EDIT_MODE.NONE}
                    />
                  </Document>
                )}
              </div>
            </div>
          </div>
        </div>
        <fetcher.Form></fetcher.Form>

        <ShareLinkDialog title={t('project.shareProject')} link={query.data?.cipher ?? ''} />

        <dialog id="editorHelpDialog" className="modal">
          <div className="modal-box w-11/12 max-w-6xl">
            <img src={helpImage} alt="editor-help" />
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
          </div>
        </dialog>

        <dialog id="deleteDialog" className="modal">
          <form method="dialog" className="modal-box" onSubmit={(_) => handleDeleteMark()}>
            <h3 className="font-bold text-lg">{t('project.removeProject')}</h3>
            <p className="py-4">{t('project.removeWarning')}</p>
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  (window as any)?.deleteDialog?.close();
                }}
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('ok')}
              </button>
            </div>
          </form>
        </dialog>
      </div>
    </div>
  );
}
