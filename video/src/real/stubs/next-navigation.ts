import { createContext, useContext } from "react";

/** next/navigation for the video: each app scene sets the pathname it is showing through PathContext. */
export const PathContext = createContext("/home");

const noop = (..._args: unknown[]) => {};
const router = { push: noop, replace: noop, refresh: noop, back: noop, forward: noop, prefetch: noop };

export const usePathname = () => useContext(PathContext);
export const useRouter = () => router;
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export const redirect = () => {};
export const notFound = () => {};
