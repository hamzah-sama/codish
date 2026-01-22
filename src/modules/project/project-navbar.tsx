"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Id } from "../../../convex/_generated/dataModel";
import { ProjectName } from "./project-name";
import { ProjectStatus } from "./project-status";

interface Props {
  projectId: Id<"projects">;
}

export const ProjectNavbar = ({ projectId }: Props) => {
  return (
    <nav className=" w-full flex items-center px-4 pr-5 bg-background border-b">
      <div className="flex items-center w-full gap-4 justify-between">
        <div className="flex gap-4 items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="flex items-center gap-1 p-2">
                    <Image src="/logo.svg" alt="Logo" width={18} height={18} />
                    <span className="text-md font-semibold tracking-tight -translate-y-0.5">
                      Codish
                    </span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <ProjectName projectId={projectId} />
            </BreadcrumbList>
          </Breadcrumb>
          <ProjectStatus projectId={projectId} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
