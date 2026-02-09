// app/layout.js
import "./globals.css";
import { Inter } from "next/font/google";
import { SettingsProvider } from "../context/SettingsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GLL | Construction Management",
  description: "Project management for general contractors",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}