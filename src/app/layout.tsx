import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const [hospital] = await Promise.all([prisma.setting.findMany({ take: 20 })]).catch(() => [[] as { key: string; value: string }[]]);
  const map: Record<string, string> = {};
  for (const r of hospital) map[r.key] = r.value;
  const title = `${map.HOSPITAL_NAME || "Jeevan Jyoti Hospital"}, Sirsa`;
  return {
    title: {
      default: `${title} — Online Appointments, Doctors, Departments`,
      template: `%s · ${title}`,
    },
    description:
      "Book OPD appointments online with verified availability, check appointment status, view doctors and departments of Jeevan Jyoti Hospital, Sirsa (Haryana).",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const settings = await prisma.setting
    .findMany()
    .catch(() => [] as { key: string; value: string }[]);
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        {session?.role === "ADMIN" ? (
          // Admin shell handles its own chrome (sidebar).
          <>{children}</>
        ) : (
          <>
            <Header
              name={map.HOSPITAL_NAME || "Jeevan Jyoti Hospital"}
              nameHi={map.HOSPITAL_NAME_HI || ""}
              emergency={map.EMERGENCY_PHONE || "+91 90000 00001"}
            />
            <main className="flex-1">{children}</main>
            <Footer />
            {!session && map.WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${map.WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact on WhatsApp"
                className="no-print fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl text-white shadow-lg transition-transform hover:scale-110"
              >
                <WhatsAppIcon />
              </a>
            )}
          </>
        )}
      </body>
    </html>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.25.7-1.45 1.34-2.02 1.42-.52.08-1.17.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5-4.35-5.16-4.55-.15-.2-1.23-1.63-1.23-3.11 0-1.48.78-2.21 1.06-2.51.27-.3.6-.38.8-.38.2 0 .4 0 .58.01.18.01.44-.07.68.52.25.6.85 2.07.92 2.22.08.15.13.33.02.53-.1.2-.15.32-.3.5-.15.17-.32.39-.46.52-.15.15-.31.31-.13.61.18.3.79 1.3 1.69 2.1 1.16 1.03 2.14 1.35 2.44 1.5.3.15.48.13.66-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.76.83 2.06.98.3.15.5.22.58.35.07.13.07.75-.18 1.45z" />
    </svg>
  );
}
