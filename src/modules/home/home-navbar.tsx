import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthButton } from "@/components/auth-button";

export const HomeNavbar = () => {
  return (
    <nav className="fixed top-0 right-0 left-0 w-full flex items-center px-4 pr-5 bg-background z-50 h-12">
      <div className="flex items-center w-full gap-4 justify-between">
        <div className="flex items-center shrink-0 ">
          <Link href="/" className="flex items-center gap-1 p-2">
            <Image src="/logo.svg" alt="Logo" width={24} height={24} />
            <span className="text-xl font-bold tracking-tight -translate-y-0.5">
              Codish
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};