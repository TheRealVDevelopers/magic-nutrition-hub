import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { ClubProvider } from "@/lib/clubDetection";
import { AuthProvider } from "@/lib/auth";
import App from "./App.tsx";
import "./index.css";

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
