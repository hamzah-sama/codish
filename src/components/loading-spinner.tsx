import { Spinner } from "./ui/spinner";

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <Spinner className="size-4 text-ring"/>
    </div>
  );
};
