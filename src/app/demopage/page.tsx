"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    await fetch("/api/demo", { method: "POST" });
    setLoading(false);
  };
  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Loading..." : "Test"}
    </Button>
  );
};

export default Page;
