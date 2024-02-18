import { Popover, PopoverContent, PopoverArrow, PopoverAnchor } from '~/components/ui/Popover';
import { CheckIcon, XIcon } from '../Icons';

type Props = {
  children: React.ReactNode;
  opened: boolean;
  content: string;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function PDFMarkPopover(props: Props) {
  const { opened, children, onCancel, onSubmit, content, onChange } = props;

  const handleOpenChange = (open: boolean) => {
    if (!open) onCancel();
  };
  return (
    <Popover open={opened} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="bg-base-100 shadow-md rounded-md p-4 flex flex-col gap-2 text-sm">
        <h2 className="font-bold text-md">Description</h2>
        <textarea
          rows={3}
          maxLength={100}
          value={content}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={(e) => {
            e.target.select();
          }}
          className="textarea textarea-bordered mb-1"
          name="content"
        />
        <div className="flex gap-2 justify-end font-bold">
          <button className="btn btn-xs" onClick={() => onCancel()}>
            <XIcon />
          </button>
          <button
            className="btn btn-xs btn-primary"
            onClick={() => {
              onSubmit();
            }}
          >
            <CheckIcon />
          </button>
        </div>
        <PopoverArrow className="fill-white" />
      </PopoverContent>
    </Popover>
  );
}
