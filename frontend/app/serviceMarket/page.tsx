"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    MapPin,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Star,
    LayoutGrid,
    ArrowRight,
} from "lucide-react";
import { useSessionManager } from "@/components/Auth/SessionManager";

interface Service {
    uuid: string;
    id?: string;
    title: string;
    description: string;
    tags: string[];
    images: string[];
    price_range: string;
    location: string;
    provider_name?: string;
    rating?: number;
    reviews_count?: number;
}

export default function ServiceMarketPage() {
    const router = useRouter();
    const sessionManager = useSessionManager();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/serviceMarket", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch services");
                const data = await response.json();

                // Map backend data to UI
                const mappedData = data.map((s: any) => ({
                    uuid: s.uuid,
                    id: s.uuid,
                    title: s.title,
                    description: s.description,
                    tags: s.tags || [],
                    images: s.images || [],
                    price_range: s.price_range,
                    location: s.location || "Remote",
                    provider_name: s.provider_name || "Verified Expert",
                    rating: 4.8, // Placeholder
                    reviews_count: 120, // Placeholder
                }));

                setServices(mappedData);
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError(
                    err.message || "Something went wrong. Please try again.",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    // Pagination Logic
    const totalPages = Math.ceil(services.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentServices = services.slice(indexOfFirst, indexOfLast);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
                <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm text-center max-w-md">
                    <h3 className="text-2xl font-black text-zinc-900 mb-4">
                        Error Loading Services
                    </h3>
                    <p className="text-zinc-500 font-bold mb-8">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black transition-all active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Nav Header */}
            <header className="border-b border-zinc-100 bg-white sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => router.push("/")}
                        >
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <LayoutGrid className="text-white w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-zinc-900">
                                Nitigati
                            </span>
                        </div>

                        <div className="relative hidden md:block group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search for experts..."
                                className="w-80 h-11 bg-zinc-100 rounded-xl pl-11 pr-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-emerald-500/10 transition-all border border-transparent focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm font-black text-zinc-500">
                        <span className="cursor-pointer hover:text-emerald-500">
                            Explore
                        </span>
                        <span className="cursor-pointer hover:text-emerald-500">
                            About
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="h-10 px-6 rounded-xl text-zinc-900 hover:bg-zinc-100 transition-all">
                                Login
                            </button>
                            <button className="h-10 px-6 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-12 flex gap-12">
                {/* Left Sidebar - Filters */}
                <aside className="w-72 flex-shrink-0">
                    <div className="sticky top-32 space-y-10">
                        <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                            Filters
                        </h2>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                Category
                            </h3>
                            <div className="space-y-4">
                                {[
                                    "All Services",
                                    "Content Writing",
                                    "Visual Design",
                                    "Market Strategy",
                                    "Tech Support",
                                ].map((cat) => (
                                    <label
                                        key={cat}
                                        className="flex items-center gap-3 cursor-pointer group"
                                    >
                                        <div className="w-5 h-5 border-2 border-zinc-200 rounded-md flex items-center justify-center group-hover:border-emerald-500 transition-all">
                                            {cat === "Content Writing" && (
                                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                                            )}
                                        </div>
                                        <span
                                            className={`text-sm font-bold ${cat === "Content Writing" ? "text-zinc-900" : "text-zinc-500"} group-hover:text-emerald-500 transition-all`}
                                        >
                                            {cat}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                Price Range
                            </h3>
                            <div className="space-y-4">
                                <div className="h-2 bg-emerald-50 rounded-full relative">
                                    <div className="absolute left-[20%] right-[30%] top-0 bottom-0 bg-emerald-500 rounded-full"></div>
                                    <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-emerald-500 rounded-full shadow-md cursor-pointer"></div>
                                    <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-emerald-500 rounded-full shadow-md cursor-pointer"></div>
                                </div>
                                <div className="flex justify-between text-[11px] font-black text-zinc-400">
                                    <span>$0</span>
                                    <span className="text-zinc-900">
                                        $100 - $1,500
                                    </span>
                                    <span>$5,000+</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                Service Location
                            </h3>
                            <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-4 border border-zinc-100">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                                    <MapPin size={18} />
                                </div>
                                <span className="text-sm font-bold text-zinc-900">
                                    Remote First
                                </span>
                            </div>
                        </div>

                        <button className="w-full h-14 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm hover:bg-emerald-100 active:scale-95 transition-all">
                            Reset All Filters
                        </button>

                        <div className="bg-emerald-950 rounded-[2.5rem] p-8 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-white mb-3">
                                    Need help finding the right expert?
                                </h3>
                                <p className="text-emerald-200/60 text-sm font-bold mb-6 leading-relaxed">
                                    Speak with a project advisor for a custom
                                    match.
                                </p>
                                <button className="bg-emerald-500 text-white px-6 h-12 rounded-xl text-xs font-black active:scale-95 transition-all flex items-center gap-2 group/btn">
                                    Get Advice{" "}
                                    <ArrowRight
                                        size={14}
                                        className="group-hover/btn:translate-x-1 transition-transform"
                                    />
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 space-y-10">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">
                                Expert Service Providers
                            </h1>
                            <p className="text-zinc-400 font-bold">
                                {services.length} verified experts available for
                                your project
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                                Sort by:
                            </span>
                            <div className="bg-white border border-zinc-100 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer hover:border-emerald-500/20 transition-all shadow-sm">
                                <span className="text-sm font-bold text-zinc-900">
                                    Highest Rated
                                </span>
                                <ChevronRight
                                    size={14}
                                    className="rotate-90 text-zinc-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services Grid (List Style) */}
                    <div className="space-y-6">
                        {currentServices.map((service) => (
                            <div
                                key={service.uuid}
                                onClick={() =>
                                    router.push(`/service/${service.uuid}`)
                                }
                                className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm flex gap-8 group hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative"
                            >
                                <div className="w-56 h-44 bg-zinc-100 rounded-[2rem] overflow-hidden flex-shrink-0 relative">
                                    {service.images?.[0] ? (
                                        <img
                                            src={service.images[0]}
                                            alt={service.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                            <LayoutGrid size={40} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        PRO
                                    </div>
                                </div>

                                <div className="flex-1 py-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-zinc-900 mb-1 group-hover:text-emerald-500 transition-colors">
                                                {service.title}
                                            </h3>
                                            <p className="text-zinc-500 font-bold text-sm tracking-tight">
                                                {service.provider_name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                            <Star
                                                size={14}
                                                className="fill-amber-400 text-amber-400"
                                            />
                                            <span className="text-sm font-black text-amber-700">
                                                {service.rating}
                                            </span>
                                            <span className="text-xs font-bold text-amber-700/50">
                                                ({service.reviews_count}+)
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-8 line-clamp-2 max-w-2xl">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-2 text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                                            <MapPin
                                                size={14}
                                                className="text-emerald-500"
                                            />
                                            <span>{service.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                                            <MessageSquare
                                                size={14}
                                                className="text-emerald-500"
                                            />
                                            <span>
                                                Est. {service.price_range} /
                                                Project
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-48 flex flex-col items-center justify-center border-l border-zinc-50 pl-8 gap-4">
                                    <button className="w-full h-12 bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <MessageSquare size={14} /> Discuss
                                        Order
                                    </button>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                        Avg. response: 2 hours
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-8">
                            <button
                                onClick={() =>
                                    handlePageChange(currentPage - 1)
                                }
                                disabled={currentPage === 1}
                                className="w-12 h-12 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-500 disabled:opacity-50 disabled:hover:text-zinc-400 transition-all shadow-sm"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`w-12 h-12 rounded-xl text-sm font-black transition-all shadow-sm ${
                                        currentPage === i + 1
                                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                            : "bg-white border border-zinc-100 text-zinc-500 hover:border-emerald-500/20"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() =>
                                    handlePageChange(currentPage + 1)
                                }
                                disabled={currentPage === totalPages}
                                className="w-12 h-12 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-500 disabled:opacity-50 disabled:hover:text-zinc-400 transition-all shadow-sm"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </section>
            </main>

            {/* Footer Placeholder */}
            <footer className="border-t border-zinc-100 py-12 mt-20">
                <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    <div className="flex items-center gap-8">
                        <span className="text-zinc-900">
                            Nitigati Marketplace
                        </span>
                        <span>© 2026 Nitigati Inc.</span>
                    </div>
                    <div className="flex gap-8">
                        <span>Terms</span>
                        <span>Privacy</span>
                        <span>Trust & Safety</span>
                        <span>Support</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
