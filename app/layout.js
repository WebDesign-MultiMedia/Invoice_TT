import "./globals.css";

export const metadata = {
  title: "Paid Receipt & Invoice Generator",
  description: "Internal tool for generating and sending paid receipts to customers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
