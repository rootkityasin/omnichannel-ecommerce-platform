"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCartStore } from "@/lib/store";

const GlobalCheckoutDrawer = dynamic(
  () =>
    import("./GlobalCheckoutDrawer").then((mod) => mod.GlobalCheckoutDrawer),
  { ssr: false },
);

export function DynamicCheckout() {
  const isCheckoutOpen = useCartStore((state) => state.checkoutOpen);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (isCheckoutOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasMounted(true);
    }
  }, [isCheckoutOpen]);

  if (!hasMounted) return null;

  return <GlobalCheckoutDrawer />;
}
