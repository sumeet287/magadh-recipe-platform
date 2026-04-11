import { prisma } from "@/lib/prisma";
import { MessageSquare, Mail, Phone, Clock, User } from "lucide-react";

export const metadata = { title: "Contact Inquiries | Magadh Recipe Admin" };

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  const unread = inquiries.filter((i) => i.status === "NEW").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-400" />
            Contact Inquiries
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {inquiries.length} total inquiries · {unread} new
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No inquiries yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`rounded-xl border p-5 transition-colors ${
                inquiry.status === "NEW"
                  ? "bg-brand-500/5 border-brand-500/20"
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 text-sm font-bold">
                    {inquiry.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{inquiry.name}</p>
                      {inquiry.status === "NEW" && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {inquiry.email}
                      </span>
                      {inquiry.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {inquiry.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(inquiry.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="ml-12">
                <p className="text-brand-300 text-sm font-medium mb-1">{inquiry.subject}</p>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
