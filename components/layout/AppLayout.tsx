"use client";

import { BottomNav } from "./BottomNav";
import { DataInitializer } from "../DataInitializer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        paddingBottom: "80px",
      }}
    >
      <DataInitializer />
      <main>{children}</main>
      <BottomNav />
      <ToastContainer position="top-center" autoClose={2500} theme="dark" hideProgressBar />
    </div>
  );
}
