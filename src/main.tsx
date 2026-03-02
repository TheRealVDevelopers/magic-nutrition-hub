import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { ClubProvider } from "@/lib/clubDetection";
import { AuthProvider } from "@/lib/auth";
import { seedSuperAdminIfNeeded } from "@/lib/seedSuperAdmin";
import App from "./App.tsx";
import "./index.css";
import "./styles/print.css";


// Fire-and-forget — runs once ever, fails silently, never delays app startup
seedSuperAdminIfNeeded();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <ClubProvider>
            <AuthProvider>
                <TooltipProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </TooltipProvider>
            </AuthProvider>
        </ClubProvider>
    </QueryClientProvider>
);
