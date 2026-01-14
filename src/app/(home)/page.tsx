"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/nextjs";

const Page = () => {
  const projects = useQuery(api.projects.get);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const createProjects = useMutation(api.projects.create);
  const handleSubmit = async () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    await createProjects({ name: "new" });
  };

  return (
    <main className="flex justify-center items-center">
      <div>
        <Button onClick={handleSubmit}>Create</Button>
        {projects?.map((project) => (
          <div key={project._id}>
            <p>{project.ownerId}</p>
            <p>{project.name}</p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Page;
