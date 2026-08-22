"use client";

import { BottomNav } from "./BottomNav";
import { DataInitializer } from "../DataInitializer";
import { WhatsNewDialog } from "../WhatsNewDialog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <DataInitializer />
      <main>{children}</main>
      <WhatsNewDialog />
      <BottomNav />
      <ToastContainer position="top-center" autoClose={2500} theme="dark" hideProgressBar />
    </div>
  );
}
