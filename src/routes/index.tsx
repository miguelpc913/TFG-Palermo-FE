import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import MergePad from "../../public/mergepad.svg";

type ArtifactsDictionary = {
  windows?: string;
  linux?: string;
  macOs?: string;
};

const HomePage = () => {
  const artifactsQuery = useQuery({
    queryKey: ["artifacts-query"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/artifacts`);
      return res.json() as Promise<ArtifactsDictionary>;
    },
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-100 to-white text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className=" flex mx-20  items-center justify-between px-4 py-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <MergePad />

            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">Mergepad</span>
              <span className="text-xs text-slate-500">Offline-first, CRDT-powered workspace</span>
            </div>
          </div>

          {/* Auth actions (TanStack Router links) */}
          <nav className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-700" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button className=" text-white " asChild>
              <Link to="/register">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">
        <section className="mx-20 flex  flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
          {/* Hero text */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Stays in sync — even when you're offline.
            </div>

            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                A Notion-style workspace that
                <span className="text-emerald-600"> never fights your sync</span>.
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base">
                Mergepad uses CRDTs under the hood so your notes, docs, and boards work flawlessly
                offline and merge automatically when you're back online — no conflicts, no "last
                write wins" headaches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className=" text-white " asChild>
                <Link to="/register">Start for free</Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  const el = document.getElementById("downloads");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Download desktop app
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Fully local-first · Sync on your terms · Built for power users
            </p>
          </div>

          {/* Download cards */}
          <div
            id="downloads"
            className="flex-1 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-semibold tracking-tight">Download Mergepad</h2>
            <p className="text-sm text-slate-600">
              Choose your platform and bring your CRDT-powered workspace to the desktop.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Windows */}
              <Card className="border-slate-200 bg-slate-50">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">
                      <FaWindows />
                    </span>
                    <span>Windows</span>
                  </CardTitle>
                  <CardDescription>Installer for Windows 10+</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    size="sm"
                    className={`w-full text-white ${
                      artifactsQuery.data?.windows
                        ? "cursor-pointer"
                        : "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                    }`}
                    disabled={!artifactsQuery.data?.windows}
                    asChild
                    onClick={() => {
                      if (artifactsQuery.data?.windows) {
                        window.open(artifactsQuery.data?.windows);
                      }
                    }}
                  >
                    <p>Download .exe</p>
                  </Button>
                </CardContent>
              </Card>

              {/* macOS */}
              <Card className="border-slate-200 bg-slate-50">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">
                      <FaApple />
                    </span>
                    <span>macOS</span>
                  </CardTitle>
                  <CardDescription>
                    Universal build (Intel &amp; Apple&nbsp;Silicon)
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    size="sm"
                    asChild
                    className={`w-full text-white ${
                      artifactsQuery.data?.macOs
                        ? "cursor-pointer"
                        : "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                    }`}
                    disabled={!artifactsQuery.data?.macOs}
                    onClick={() => {
                      if (artifactsQuery.data?.macOs) {
                        window.open(artifactsQuery.data?.macOs);
                      }
                    }}
                  >
                    {/* Replace with real link */}
                    <p>Download .dmg</p>
                  </Button>
                </CardContent>
              </Card>

              {/* Linux */}
              <Card className="border-slate-200 bg-slate-50">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">
                      <FaLinux />
                    </span>
                    <span>Linux</span>
                  </CardTitle>
                  <CardDescription>AppImage &amp; .deb packages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 mt-auto">
                  <Button
                    variant="outline"
                    className={`w-full border-slate-300 bg-white text-slate-800 hover:bg-slate-50 ${
                      artifactsQuery.data?.linux
                        ? "cursor-pointer"
                        : "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                    }`}
                    disabled={!artifactsQuery.data?.linux}
                    onClick={() => {
                      if (artifactsQuery.data?.linux) {
                        window.open(artifactsQuery.data?.linux);
                      }
                    }}
                  >
                    {/* Replace with real link */}
                    <p>Download AppImage</p>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Sync engine powered by CRDTs · Ideal for spotty connections, plane rides, and cafés
              with terrible Wi-Fi.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white/80">
        <div className=" flex mx-20  flex-col gap-4 px-4 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs">&copy; {new Date().getFullYear()}</span>
            <Separator orientation="vertical" className="h-4 bg-slate-300" />
            <span>Mergepad. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="hover:text-slate-800 transition-colors">Privacy</p>
            <p className="hover:text-slate-800 transition-colors">Terms</p>
            <p className="hover:text-slate-800 transition-colors">Support</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: HomePage,
  beforeLoad: async () => {
    if (isTauri()) {
      throw redirect({
        to: "/login",
      });
    }
  },
});
