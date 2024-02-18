import { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from './PopoverExt';

type Props = {
  color: string;
  onChange: (color: string) => void;
};

export const PopoverColorPicker = (props: Props) => {
  const { color, onChange } = props;
  const [isOpen, toggle] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={toggle}>
      <PopoverTrigger>
        <div
          className="w-5 h-5 rounded-sm cursor-pointer"
          style={{
            backgroundColor: color,
            border: '3px solid #fff',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
          }}
          onClick={() => toggle((prev) => !prev)}
        />
      </PopoverTrigger>
      <PopoverContent className="bg-base-100 shadow-md rounded-md p-4 flex flex-col gap-2 text-sm z-10">
        <HexColorPicker color={color} onChange={onChange} />
        <HexColorInput color={color} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
};
