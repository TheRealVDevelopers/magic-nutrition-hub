import { useEffect } from "react";
import { useClubContext } from "@/lib/clubDetection";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function Landing() {
    const { club, loading } = useClubContext();

    // Listen for navigation requests posted from inside the landing page iframe.
    // The iframe HTML uses window.parent.postMessage({type:'MNC_NAVIGATE', path:'/login'}, '*')
    // because <a href="/login"> inside an iframe navigates the iframe itself, not the parent.
    useEffect(() => {
        function handler(e: MessageEvent) {
            if (e.data?.type === "MNC_NAVIGATE" && typeof e.data.path === "string") {
                window.location.href = e.data.path;
            }
        }
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Club Not Found</h1>
                    <p className="text-gray-500 mt-2">No club is registered for this domain.</p>
                </div>
            </div>
        );
    }

    if (!club.landingPageUrl) {
        return <ComingSoonPage club={club} />;
    }

    return (
        <iframe
            src={club.landingPageUrl}
            className="w-full h-screen border-0"
            title={club.name}
        />
    );
}
