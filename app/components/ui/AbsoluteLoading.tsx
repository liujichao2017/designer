type Props = {
  children?: React.ReactNode;
};

export default function AbsoluteLoading(props: Props) {
  const { children } = props;
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-white z-[21]">
      <span className="loading loading-spinner loading-lg"></span>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
