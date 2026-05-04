import { useEffect, useRef, useState } from "react";

export default function ServerStatus() {
  const [servers, setServers] = useState({
    django: "checking",
    fastapi: "checking",
  });

  const retryTimersRef = useRef({});
  const inFlightRef = useRef({ django: false, fastapi: false });
  const controllersRef = useRef({});

  const DJANGO_API = import.meta.env.VITE_API_BASE_URL;
  const FASTAPI_API = import.meta.env.VITE_FASTAPI_PORT;
  const DJANGO_KEEP_ALIVE_INTERVAL_MS = Number(import.meta.env.VITE_DJANGO_KEEP_ALIVE_INTERVAL_MS) || 30000;
  const FASTAPI_KEEP_ALIVE_INTERVAL_MS = Number(import.meta.env.VITE_FASTAPI_KEEP_ALIVE_INTERVAL_MS) || 240000;

  // Safe URL builder (avoids // or missing /)
  const buildUrl = (base, path) => {
    return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  };

  // Auto run on load
  useEffect(() => {
    const checkServer = async (name, baseUrl, path) => {
      if (!baseUrl || inFlightRef.current[name]) return;

      inFlightRef.current[name] = true;
      const url = buildUrl(baseUrl, path);
      const controller = new AbortController();
      controllersRef.current[name] = controller;
      let timeout;

      try {
        console.log("Checking:", name, url);

        // Increased timeout (Cloudflare safe)
        timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.ok) {
          setServers((prev) => ({ ...prev, [name]: "online" }));

          if (retryTimersRef.current[name]) {
            clearTimeout(retryTimersRef.current[name]);
            retryTimersRef.current[name] = null;
          }
        } else {
          throw new Error("Bad response");
        }

      } catch (err) {
        if (err.name === "AbortError") {
          console.warn(name, "timeout (slow response)");
        } else {
          console.error(name, "error:", err);
        }

        setServers((prev) => ({ ...prev, [name]: "offline" }));

        // retry every 5 sec if failed
        if (!retryTimersRef.current[name]) {
          retryTimersRef.current[name] = setTimeout(() => {
            retryTimersRef.current[name] = null;
            checkServer(name, baseUrl, path);
          }, 5000);
        }
      } finally {
        if (timeout) {
          clearTimeout(timeout);
        }

        delete controllersRef.current[name];
        inFlightRef.current[name] = false;
      }
    };

    const serverConfigs = [
      { name: "django", baseUrl: DJANGO_API, path: "health/" },
      { name: "fastapi", baseUrl: FASTAPI_API, path: "health/fastapi" },
    ];

    serverConfigs.forEach(({ name, baseUrl, path }) => checkServer(name, baseUrl, path));

    const djangoIntervalId = setInterval(() => {
      checkServer("django", DJANGO_API, "health/");
    }, DJANGO_KEEP_ALIVE_INTERVAL_MS);

    const fastapiIntervalId = setInterval(() => {
      checkServer("fastapi", FASTAPI_API, "health/fastapi");
    }, FASTAPI_KEEP_ALIVE_INTERVAL_MS);

    const retryTimers = retryTimersRef.current;
    const controllers = controllersRef.current;

    return () => {
      clearInterval(djangoIntervalId);
      clearInterval(fastapiIntervalId);

      Object.values(retryTimers).forEach((timerId) => {
        if (timerId) clearTimeout(timerId);
      });

      Object.values(controllers).forEach((controller) => {
        controller.abort();
      });
    };
  }, [DJANGO_API, FASTAPI_API, DJANGO_KEEP_ALIVE_INTERVAL_MS, FASTAPI_KEEP_ALIVE_INTERVAL_MS]);

  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-6 z-50 scale-90 sm:scale-100 origin-top-right">
      <div className="flex items-center gap-2 sm:gap-4 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full 
                    bg-white/80 dark:bg-slate-800/70 backdrop-blur-lg 
                    border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-xl">

        {/* Label */}
        <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          Servers:
        </span>

        {/* Django */}
        <div className="flex items-center gap-1.5 sm:gap-2 group">
          <span
            className={`shrink-0 w-2 h-2 rounded-full ${servers.django === "online"
                ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                : servers.django === "checking"
                  ? "bg-gray-400 animate-pulse"
                  : "bg-red-500 shadow-[0_0_6px_#ef4444]"
              }`}
          />
          <span className="text-[10px] sm:text-xs text-gray-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition whitespace-nowrap">
            <span className="sm:hidden">DJ: </span>
            <span className="hidden sm:inline">Django: </span>
            {servers.django === "online" ? "Online" : servers.django === "checking" ? "Checking" : "Offline"}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-3 sm:h-4 bg-gray-300 dark:bg-slate-600" />

        {/* FastAPI */}
        <div className="flex items-center gap-1.5 sm:gap-2 group">
          <span
            className={`shrink-0 w-2 h-2 rounded-full ${servers.fastapi === "online"
                ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                : servers.fastapi === "checking"
                  ? "bg-gray-400 animate-pulse"
                  : "bg-red-500 shadow-[0_0_6px_#ef4444]"
              }`}
          />
          <span className="text-[10px] sm:text-xs text-gray-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition whitespace-nowrap">
            <span className="sm:hidden">FA: </span>
            <span className="hidden sm:inline">FastAPI: </span>
            {servers.fastapi === "online" ? "Online" : servers.fastapi === "checking" ? "Checking" : "Offline"}
          </span>
        </div>

      </div>
    </div>
  );
}