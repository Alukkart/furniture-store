import type {Metadata} from "next";
import {Analytics} from "@vercel/analytics/next";
import StoreBootstrap from "@/components/StoreBootstrap";
import UISettingsSync from "@/components/UISettingsSync";
import {ThemeProvider} from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
    title: "Maison & Co. — Premium Furniture",
    description: "Discover curated furniture collections crafted for modern living. Shop sofas, beds, tables, and more.",
    generator: "v0.app",
    icons: {
        icon: [
            {
                url: "/icon-light-32x32.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/icon-dark-32x32.png",
                media: "(prefers-color-scheme: dark)",
            },
            {
                url: "/icon.svg",
                type: "image/svg+xml",
            },
        ],
        apple: "/apple-icon.png",
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <UISettingsSync/>
            <StoreBootstrap/>
            {children}
            <Analytics/>
        </ThemeProvider>
        </body>
        </html>
    );
}
