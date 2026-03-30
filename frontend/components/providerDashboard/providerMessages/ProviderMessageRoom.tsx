"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    ChevronLeft,
    Search,
    MoreVertical,
    Plus,
    Send,
    Paperclip,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Briefcase,
    FileText,
    ArrowUpRight,
    ChevronDown,
} from "lucide-react";
import { ProviderMessage, ChatMessage, OrderProposal } from "@/app/providerDashboard/page";
import { toast } from "@/components/ui/toast";

/* ────────────────────────────────────────────────────────────
   Inline Proposal Card – renders inside chat as a customer message
   ──────────────────────────────────────────────────────────── */
function ProposalCard({ onAccept, proposal }: { onAccept: () => void; proposal: OrderProposal }) {
    return (
        <div className="flex items-end gap-3 flex-row">
            {/* Avatar placeholder (matches customer bubble style) */}
            <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
                <img
                    src={`https://ui-avatars.com/api/?name=${proposal.customer_name || "Customer"}&background=00E676&color=fff`}
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="max-w-[70%]">
                <div className="rounded-[2.5rem] rounded-bl-none border-2 border-dashed border-zinc-100 bg-white shadow-sm p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FileText size={18} className="text-[#00E676]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                {proposal.service_title}
                            </p>
                            <p className="text-lg font-black text-zinc-900 leading-tight">
                                ${proposal.proposed_price}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                           {proposal.proposed_delivery_days} Days Delivery
                        </div>
                        <button
                            onClick={onAccept}
                            disabled={proposal.status !== 'pending'}
                            className={`flex-1 h-10 rounded-full ${proposal.status === 'pending' ? 'bg-[#00E676] hover:bg-[#00c968] cursor-pointer' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'} text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]`}
                        >
                            {proposal.status === 'pending' ? 'Accept' : proposal.status.toUpperCase()}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1 mt-1.5 justify-start">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 italic text-zinc-300">
                        Proposal from {proposal.sender_role}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface ProviderMessageRoomProps {
    room: ProviderMessage;
    onBack: () => void;
    userName: string;
    token: string;
    proposals: OrderProposal[];
    serviceId?: string;
    serviceTitle?: string;
}

export default function ProviderMessageRoom({
    room,
    onBack,
    userName,
    token,
    proposals: initialProposals,
    serviceId: propServiceId,
    serviceTitle: propServiceTitle
}: ProviderMessageRoomProps) {
    const [timeline, setTimeline] = useState<(ChatMessage | OrderProposal)[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Local state to capture context if props are missing
    const [localServiceContext, setLocalServiceContext] = useState<{ id: string; title: string } | null>(null);

    // Proposal Form State
    const [proposedPrice, setProposedPrice] = useState("540.00");
    const [proposedDelivery, setProposedDelivery] = useState(5);
    const [isSendingProposal, setIsSendingProposal] = useState(false);
    const [isAcceptingProposal, setIsAcceptingProposal] = useState<string | null>(null);
    const [isProcessingProposal, setIsProcessingProposal] = useState<string | null>(null);

    // Effect to update local context from room if needed
    useEffect(() => {
        if (room.last_service_id && room.last_service_title && !propServiceId) {
            setLocalServiceContext({
                id: room.last_service_id,
                title: room.last_service_title
            });
        }
    }, [room, propServiceId]);

    const serviceId = propServiceId || localServiceContext?.id;
    const serviceTitle = propServiceTitle || localServiceContext?.title || "Custom Logo & Brand Identity";

    const handleSendProposal = async () => {
        if (isSendingProposal) return;
        if (!serviceId) {
            toast.error("Set up at least one service to send proposals.");
            return;
        }
        setIsSendingProposal(true);
        try {
            const res = await fetch("/api/providers/providerDashboard/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    service: serviceId,
                    proposed_price: parseFloat(proposedPrice),
                    proposed_delivery_days: proposedDelivery,
                    sender_role: "provider",
                    room_name: room.name,
                }),
            });

            if (res.ok) {
                toast.success("Proposal sent to customer!");
                if (socketRef.current) {
                    socketRef.current.send(JSON.stringify({ 
                        message: `I've sent a counter-proposal for $${proposedPrice} with ${proposedDelivery} days delivery.` 
                    }));
                }
            } else {
                const err = await res.json();
                toast.error(err.detail || (err.service ? "Invalid Service Selected" : "Failed to send proposal"));
            }
        } catch (error) {
            console.error("Proposal send error:", error);
            toast.error("An error occurred while sending proposal");
        } finally {
            setIsSendingProposal(false);
        }
    };

    const handleAcceptProposal = async (proposalId: string) => {
        if (isAcceptingProposal) return;
        setIsAcceptingProposal(proposalId);
        try {
            const res = await fetch("/api/providers/providerDashboard/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    proposal_id: proposalId,
                    action: 'accept',
                    room_name: room.name
                }),
            });

            if (res.ok) {
                toast.success("Proposal accepted! Order created.");
                // Broadcast handled by backend
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to accept proposal");
            }
        } catch (error) {
            console.error("Proposal accept error:", error);
            toast.error("An error occurred while accepting proposal");
        } finally {
            setIsAcceptingProposal(null);
        }
    };

    const handleWithdrawProposal = async (proposalId: string) => {
        if (isProcessingProposal) return;
        setIsProcessingProposal(proposalId);
        try {
            const res = await fetch(`/api/order-proposals/${proposalId}/withdraw/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ room_name: room.name })
            });

            if (res.ok) {
                toast.success("Proposal withdrawn.");
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to withdraw proposal");
            }
        } catch (error) {
            console.error("Proposal withdraw error:", error);
            toast.error("An error occurred while withdrawing proposal");
        } finally {
            setIsProcessingProposal(null);
        }
    };

    // Fetch message history
    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(
                    `/api/providers/providerDashboard/messages/?room=${room.name}`,
                    {
                        headers: { Authorization: `Token ${token}` },
                    },
                );
                if (res.ok) {
                    const messagesData = await res.json();
                    setTimeline([...messagesData, ...(initialProposals || [])]);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        }
        fetchHistory();
    }, [room.name, token, initialProposals]);

    // WebSocket setup
    useEffect(() => {
        const wsUrl = `ws://127.0.0.1:8000/ws/chat/${room.name}/?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => console.log("WebSocket Connected");
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === 'new_proposal') {
                setTimeline((prev) => [...prev, data.proposal]);
                return;
            }

            if (data.type === 'proposal_status_change') {
                setTimeline((prev) => 
                    prev.map(item => 
                        ('proposed_price' in item && item.id === data.proposal_id)
                        ? { ...item, status: data.status }
                        : item
                    )
                );
                return;
            }

            setTimeline((prev) => [
                ...prev,
                {
                    id: Math.random().toString(), // Temp ID
                    room: room.name,
                    sender_username: data.sender,
                    content: data.message,
                    timestamp: data.timestamp,
                } as ChatMessage,
            ]);
        };
        ws.onclose = () => console.log("WebSocket Disconnected");

        socketRef.current = ws;
        return () => {
            socketRef.current = null;
            ws.close();
        };
    }, [room.name, token]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [timeline]);

    const handleSend = () => {
        const socket = socketRef.current;
        if (!input.trim() || !socket) return;
        socket.send(JSON.stringify({ 
            message: input,
            service_id: serviceId !== "00000000-0000-0000-0000-000000000000" && serviceId ? serviceId : null
        }));
        setInput("");
    };

    const customerName =
        room.participants_usernames.find((u) => u !== userName) || "Customer";

    return (
        <div className="flex h-full bg-white border-l border-zinc-100 overflow-hidden animate-in fade-in duration-500 gap-5">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Chat Header */}
                <header className="h-20 px-8 flex items-center justify-between border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all group"
                        >
                            <ChevronLeft
                                size={20}
                                className="group-hover:-translate-x-0.5 transition-transform"
                            />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-emerald-50 overflow-hidden border border-zinc-100">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${customerName}&background=00E676&color=fff&size=100`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-zinc-900 leading-none mb-1">
                                    {customerName}
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full animate-pulse shadow-[0_0_8px_#00E676]"></span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                        Customer Portfolio
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl text-zinc-400 hover:bg-zinc-50 flex items-center justify-center transition-all">
                            <Search size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-xl text-zinc-400 hover:bg-zinc-50 flex items-center justify-center transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div> */}
                </header>

                {/* Messages Container */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#fdfdfd] scroll-smooth"
                >
                    {/* Date Separator */}
                    <div className="flex justify-center">
                        <span className="px-4 py-1 rounded-full bg-zinc-100/50 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                            Today
                        </span>
                    </div>

                    {/* Chat Bubbles & Proposals */}
                    {timeline
                        .sort((a, b) => {
                            const timeA = 'created_at' in a ? new Date(a.created_at).getTime() : new Date((a as ChatMessage).timestamp).getTime();
                            const timeB = 'created_at' in b ? new Date(b.created_at).getTime() : new Date((b as ChatMessage).timestamp).getTime();
                            return timeA - timeB;
                        })
                        .map((item, idx) => {
                            // Check if it's a proposal
                            if ('proposed_price' in item) {
                                const proposal = item as OrderProposal;
                                const isMe = (proposal.sender_role === 'provider');
                                return (
                                    <div key={`prop-${idx}`} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} px-2`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
                                                <img src={`https://ui-avatars.com/api/?name=${proposal.customer_name}&background=00E676&color=fff`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] bg-white p-8 rounded-[2.5rem] ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} border-2 border-dashed border-zinc-100 shadow-xl overflow-hidden group`}>
                                            <div className="flex items-center gap-5 mb-8">
                                                <div className="w-14 h-14 bg-[#00E676]/5 text-[#00E676] rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-[#00E676]/10">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1 italic">
                                                        Proposal from {proposal.sender_role}
                                                    </p>
                                                    <h5 className="text-2xl font-black text-zinc-900 leading-none">
                                                        ${proposal.proposed_price} <span className="text-[10px] text-zinc-300 uppercase ml-1">USD</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1 h-12 border border-zinc-100 flex items-center justify-center text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                    {proposal.proposed_delivery_days} Days Delivery
                                                </div>
                                                {proposal.status === 'pending' ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <button 
                                                            onClick={() => !isMe ? handleAcceptProposal(proposal.id) : handleWithdrawProposal(proposal.id)}
                                                            disabled={isAcceptingProposal === proposal.id || isProcessingProposal === proposal.id}
                                                            className={`flex-[2] h-12 ${isMe ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200' : 'bg-[#00E676] hover:bg-[#00c968] text-white shadow-lg shadow-emerald-500/20'} rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center`}
                                                        >
                                                            {(isAcceptingProposal === proposal.id || isProcessingProposal === proposal.id) && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>}
                                                            {isMe ? 'Withdraw' : 'Accept Proposal'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={`flex-1 h-12 ${
                                                        proposal.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 
                                                        proposal.status === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-zinc-100 text-zinc-500'
                                                    } flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest border border-current/10`}>
                                                        {proposal.status.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // It's a message
                            const msg = item as ChatMessage;
                            const isMe = msg.sender_username === userName;
                            return (
                                <div key={`msg-${idx}`} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
                                            <img src={`https://ui-avatars.com/api/?name=${customerName}&background=00E676&color=fff`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] group`}>
                                        <div className={`p-5 rounded-3xl shadow-sm text-sm font-bold leading-relaxed transition-all ${isMe
                                                ? 'bg-[#00E676] text-white rounded-br-none'
                                                : 'bg-white text-zinc-600 border border-zinc-100 rounded-bl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <div className={`flex items-center gap-2 px-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <span className={`text-[8px] font-black uppercase tracking-widest opacity-40 italic ${isMe ? 'text-zinc-400' : 'text-zinc-300'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && <CheckCircle2 size={10} className="text-[#00E676] opacity-60" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Chat Footer / Input */}
                <footer className="px-8 py-6 bg-white border-t border-zinc-100 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center gap-4 bg-zinc-50 rounded-full px-6 py-2 border border-zinc-100/50 shadow-inner group">
                        {/* <button className="w-10 h-10 rounded-full bg-white border border-zinc-100 text-zinc-400 hover:text-[#00E676] transition-all shrink-0 shadow-sm flex items-center justify-center">
                            <Plus size={20} />
                        </button> */}
                        <div className="flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSend()
                                }
                                placeholder="Type your message..."
                                className="w-full h-12 bg-transparent text-sm font-bold text-zinc-700 focus:outline-none placeholder:text-zinc-300 placeholder:italic"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className="w-10 h-10 bg-[#00E676] hover:bg-[#00c968] text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </footer>
            </div>

            {/* Right Sidebar - Order Summary Section Unified */}
            <aside className="w-[380px] hidden xl:flex shrink-0 border-l border-zinc-100 bg-white">
                <div className="m-6 flex flex-col h-full rounded-[2rem] border border-zinc-100 shadow-sm bg-white p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                            Order Summary
                        </h3>
                        <span className="px-3 py-1 bg-orange-50 text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            Drafting
                        </span>
                    </div>

                    {/* Service */}
                    <div className="mb-4">
                        <p className="text-[9px] font-black text-zinc-300 uppercase mb-1">
                            Service
                        </p>
                        <p className="text-sm font-black text-zinc-900 leading-tight">
                            Custom Logo & Brand Identity
                        </p>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                        <p className="text-[9px] font-black text-zinc-300 uppercase mb-2">
                            Proposed Price ($)
                        </p>
                        <div className="h-14 rounded-xl border border-zinc-100 flex items-center justify-between px-4 bg-zinc-50 focus-within:ring-2 focus-within:ring-[#00E676] transition-all">
                            <input
                                type="number"
                                step="0.01"
                                value={proposedPrice}
                                onChange={(e) => setProposedPrice(e.target.value)}
                                className="w-full bg-transparent text-lg font-black outline-none"
                            />
                            <span className="text-[9px] text-zinc-400 uppercase shrink-0">
                                USD
                            </span>
                        </div>
                    </div>

                    {/* Delivery + Revisions */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="border border-zinc-100 rounded-xl py-3 text-center focus-within:ring-2 focus-within:ring-[#00E676] transition-all bg-zinc-50/30">
                            <p className="text-[9px] text-zinc-400 uppercase">
                                Delivery (Days)
                            </p>
                            <input
                                type="number"
                                min="1"
                                value={proposedDelivery}
                                onChange={(e) => setProposedDelivery(parseInt(e.target.value) || 1)}
                                className="w-full bg-transparent text-sm font-bold text-center outline-none"
                            />
                        </div>
                        <div className="border border-zinc-100 rounded-xl py-3 text-center bg-zinc-50/50">
                            <p className="text-[9px] text-zinc-400 uppercase">
                                Revisions
                            </p>
                            <p className="text-sm font-bold text-zinc-400">Fixed (3)</p>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-auto flex flex-col gap-3">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Service Fee (10%)</span>
                            <span>- ${(parseFloat(proposedPrice) * 0.1 || 0).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center bg-[#00E676]/10 px-4 py-3 rounded-xl ring-1 ring-[#00E676]/20">
                            <span className="text-xs font-bold">
                                You Receive
                            </span>
                            <span className="text-lg font-black text-[#00E676]">
                                ${(parseFloat(proposedPrice) * 0.9 || 0).toFixed(2)}
                            </span>
                        </div>

                        <button 
                            onClick={handleSendProposal}
                            disabled={isSendingProposal}
                            className={`w-full h-14 bg-[#00E676] hover:bg-[#00c968] mb-2 text-white rounded-xl font-black tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 ${isSendingProposal ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSendingProposal && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {isSendingProposal ? 'SENDING...' : 'SEND ORDER PROPOSAL'}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
