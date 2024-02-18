import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverArrow, PopoverTrigger } from '~/components/ui/Popover';
import type { CompareLoaderData } from '~/routes/project.$id.compare.$list_id';
import { useClickOutside } from '~/utils/useClickOutside';
import { ChevronDownIcon } from '../Icons';

type Props = {
  books: Awaited<CompareLoaderData>['data']['books'];
  bookId: number;
  onSubmit: (value: number) => void;
};

export default function PDFMarkPopover(props: Props) {
  const { books, onSubmit, bookId } = props;
  const [selectedId, setSelectId] = useState(bookId);
  const [open, setOpen] = useState(false);

  const currentBook = books.find((book) => book.id === selectedId);
  const popRef = useRef(null);

  useClickOutside(popRef, () => setOpen(false));

  return (
    <Popover open={open}>
      <PopoverTrigger onClick={() => setOpen(true)} className="w-[200px]">
        <button className="flex items-center gap-2" type="button">
          {currentBook?.project_name}
          <span
            style={{
              transform: `rotate(${open ? '180deg' : '0deg'})`,
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <ChevronDownIcon />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={popRef}
        className="bg-base-100 shadow-md rounded-md p-2 flex flex-col gap-2 text-sm h-[240px] overflow-auto"
      >
        {books.map((book) => {
          return (
            <div
              key={book.id}
              className="flex justify-center my-1 p-2 rounded-md cursor-pointer hover:bg-blue-100"
              onClick={() => {
                setSelectId(book.id);
                onSubmit(book.id);
                setOpen(false);
              }}
            >
              <img
                className="w-[150px] h-[84px] object-cover mr-5"
                src={book?.pages[0]?.litpic_url || undefined}
                alt="book-thumbnail"
              />
              <div>
                <p className="mt-2 mb-3 font-bold">{book.project_name}</p>
                <p>{dayjs(book.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
              </div>
            </div>
          );
        })}
        <PopoverArrow className="fill-white" />
      </PopoverContent>
    </Popover>
  );
}
