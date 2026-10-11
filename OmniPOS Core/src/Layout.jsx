import React from "react";

export default function Layout({ children, currentPageName }) {
  // POS page gets full-screen treatment with no chrome
  return (
    <div className="h-screen overflow-hidden bg-gray-950">
      {children}
    </div>
  );
}