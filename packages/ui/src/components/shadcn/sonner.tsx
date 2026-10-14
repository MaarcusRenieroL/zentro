"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      closeButton
      visibleToasts={4}
      style={
        {
          "--normal-bg": "var(--overlay)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--border-default)",
          "--success-bg": "var(--overlay)",
          "--success-text": "var(--ink)",
          "--success-border": "var(--border-default)",
          "--error-bg": "var(--overlay)",
          "--error-text": "var(--ink)",
          "--error-border": "var(--border-default)",
          "--border-radius": "var(--radius-lg)",
          zIndex: "var(--z-toast)",
        } as ToasterProps["style"]
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-lg",
          icon: "data-[type=success]:text-success data-[type=error]:text-danger data-[type=warning]:text-warning data-[type=info]:text-info",
          actionButton: "!bg-primary !text-primary-foreground",
        },
      }}
      containerAriaLabel="Notifications"
      {...props}
    />
  );
};

export { Toaster };
