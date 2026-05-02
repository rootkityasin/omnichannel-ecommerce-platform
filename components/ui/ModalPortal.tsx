"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");

    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(children, document.body);
}
