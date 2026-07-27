import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config/app-config";

const routes = [
  "",
  "/competitions",
  "/methodology",
  "/integrity",
  "/about",
  "/admin",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    changeFrequency: "weekly",
    lastModified: new Date("2026-07-25T00:00:00.000Z"),
    priority: route === "" ? 1 : 0.6,
    url: `${appConfig.publicUrl}${route}`,
  }));
}
