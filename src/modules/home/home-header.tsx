import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";

const font = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const HomeHeader = () => {
  return (
    <header className="flex items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 w-full group/logo">
        <img src="/logo.svg" alt="Logo" className="size-8  md:size-12" />
        <h1
          className={cn("text-4xl md:text-5xl font-semibold", font.className)}
        >
          Codish
        </h1>
      </div>
    </header>
  );
};
