"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then((reg) => {
                    console.log("[SW] Registered:", reg.scope);

                    // Check for updates on each page load
                    reg.update();

                    // Prompt user to refresh when a new SW is waiting
                    reg.addEventListener("updatefound", () => {
                        const newWorker = reg.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener("statechange", () => {
                            if (
                                newWorker.state === "installed" &&
                                navigator.serviceWorker.controller
                            ) {
                                // A new version is ready — you could show a toast here
                                console.log("[SW] New version available. Refresh to update.");
                            }
                        });
                    });
                })
                .catch((err) => console.error("[SW] Registration failed:", err));
        }
    }, []);

    return null;
}
