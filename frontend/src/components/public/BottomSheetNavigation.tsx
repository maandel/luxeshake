"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Coffee, Info, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomSheetNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BottomSheetNavigation: React.FC<BottomSheetNavigationProps> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();

  // Close sheet when route changes
  useEffect(() => {
    if (isOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navItems = [
    { name: "Home", href: "/", icon: <Home size={20} /> },
    { name: "Menu", href: "/menu", icon: <Coffee size={20} /> },
    { name: "About Us", href: "/about", icon: <Info size={20} /> },
    { name: "Cart", href: "/checkout", icon: <ShoppingBag size={20} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-surface-container-high rounded-t-3xl border-t border-gold-leaf/20 shadow-2xl p-6 pb-12 flex flex-col gap-6"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display-lg text-primary text-xl tracking-wide">
                LuxeShake
              </h2>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-full bg-surface-container p-2"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-on-surface hover:bg-surface-container-highest"
                    }`}
                  >
                    <span className={isActive ? "text-primary" : "text-on-surface-variant"}>
                      {item.icon}
                    </span>
                    <span className="text-lg">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
