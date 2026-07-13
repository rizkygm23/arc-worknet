"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  children,
  brand,
  actions,
  className,
  style,
  ...props
}: React.ComponentProps<typeof motion.div> & {
  brand?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  return (
    <>
      <DesktopSidebar className={className} style={style} {...props}>{children as React.ReactNode}</DesktopSidebar>
      <MobileSidebar brand={brand} actions={actions} {...(props as React.ComponentProps<"div">)}>
        {children as React.ReactNode}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col w-[300px] shrink-0",
          className
        )}
        style={{
          background: "var(--bg)",
          borderRight: "var(--rule-thin) solid var(--hairline)",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
          ...style,
        }}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  brand,
  actions,
  ...props
}: React.ComponentProps<"div"> & {
  brand?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "mobile-bar flex flex-row md:hidden items-center justify-between w-full",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {brand}
        </div>
        <div className="flex items-center gap-4 z-20">
          {actions}
          <button
            type="button"
            className="cursor-pointer p-1"
            style={{ background: "transparent", border: "none", color: "var(--ink)", display: "flex", alignItems: "center" }}
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            id="mobile-menu-trigger"
          >
            <IconMenu2 />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 p-10 z-[100] flex flex-col justify-between md:hidden",
              className
            )}
            style={{ background: "var(--bg)", color: "var(--ink)" }}
          >
            <button
              type="button"
              className="absolute right-10 top-10 z-50 cursor-pointer p-1"
              style={{ background: "transparent", border: "none", color: "var(--ink)", display: "flex", alignItems: "center" }}
              onClick={() => setOpen(!open)}
              aria-label="Close menu"
              id="mobile-menu-close"
            >
              <IconX />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md transition-colors duration-150",
        active
          ? "font-semibold"
          : "hover:translate-x-0",
        className
      )}
      style={{
        color: active ? "var(--accent)" : "var(--muted)",
        background: active ? "var(--accent-soft)" : "transparent",
        fontWeight: active ? 600 : 500,
        fontSize: "var(--text-sm)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--ink)";
          e.currentTarget.style.background = "var(--surface-muted)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "transparent";
        }
      }}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="whitespace-pre inline-block !p-0 !m-0"
        style={{ color: "inherit" }}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const SidebarGroupTitle = ({ children }: { children: React.ReactNode }) => {
  const { open, animate } = useSidebar();
  return (
    <motion.div
      animate={{
        display: animate ? (open ? "block" : "none") : "block",
        opacity: animate ? (open ? 0.65 : 0) : 0.65,
      }}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--muted)",
        padding: "0 8px",
        marginBottom: "4px",
        marginTop: "8px",
      }}
    >
      {children}
    </motion.div>
  );
};
