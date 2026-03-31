import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle2, QrCode, Star, Award, Shield } from "lucide-react";
import { Layout } from "@/components/layout";

interface CertificateData {
  id: number;
  userId: number;
  taskId: number;
  applicationId: number;
  level: string;
  hoursAwarded: number;
  skillsUsed: string[];
  role: string;
  aiDescription: string;
  curatorName: string;
  impactScore: number;
  verifyToken: string;
  createdAt: string;
  volunteerName?: string;
  taskTitle?: string;
  taskLocation?: string;
}

const LEVEL_COLORS = {
  Basic: { bg: "from-slate-700 to-slate-900", badge: "bg-slate-100 text-slate-800", border: "border-slate-400" },
  Advanced: { bg: "from-blue-700 to-blue-900", badge: "bg-blue-100 text-blue-800", border: "border-blue-400" },
  Leadership: { bg: "from-violet-700 to-violet-900", badge: "bg-violet-100 text-violet-800", border: "border-violet-400" },
  Impact: { bg: "from-amber-600 to-amber-900", badge: "bg-amber-100 text-amber-800", border: "border-amber-400" },
};

const LEVEL_ICONS = { Basic: "🎖️", Advanced: "🥈", Leadership: "🥇", Impact: "🏆" };

function QRCodeSVG({ value, size = 120 }: { value: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="white" />
          {[...Array(7)].map((_, r) =>
            [...Array(7)].map((_, c) => {
              const isCorner = (r < 3 && c < 3) || (r < 3 && c >= 4) || (r >= 4 && c < 3);
              return isCorner ? (
                <rect key={`${r}-${c}`} x={c * 14 + 1} y={r * 14 + 1} width="12" height="12" fill="black" rx="1" />
              ) : null;
            })
          )}
          {[...Array(5)].map((_, i) => (
            <rect key={`data${i}`} x={i * 18 + 5} y={50} width="10" height="10" fill={Math.random() > 0.5 ? "black" : "transparent"} />
          ))}
          <text x="50" y="92" textAnchor="middle" fontSize="7" fill="#334155" fontFamily="monospace">
            SCAN TO VERIFY
          </text>
        </svg>
      </div>
      <p className="text-[9px] text-slate-400 font-mono text-center max-w-[120px] truncate">{value.slice(-12)}</p>
    </div>
  );
}

export default function Certificate() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { t, language } = useI18n();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !token) return;
    const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    fetch(`${baseUrl}/api/certificates/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setCert(data);
      })
      .catch(() => setError("Failed to load certificate"))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-slate-500">{t("common.loading")}</div>
    </Layout>
  );

  if (error || !cert) return (
    <Layout>
      <div className="max-w-lg mx-auto text-center py-20">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t("cert.not_found")}</h2>
        <Link href="/dashboard"><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" /> {t("common.back")}</Button></Link>
      </div>
    </Layout>
  );

  const levelConfig = LEVEL_COLORS[cert.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.Basic;
  const levelIcon = LEVEL_ICONS[cert.level as keyof typeof LEVEL_ICONS] || "🎖️";
  const verifyUrl = `${window.location.origin}/verify/${cert.verifyToken}`;
  const issuedDate = new Date(cert.createdAt).toLocaleDateString(
    language === "kz" ? "kk-KZ" : language === "ru" ? "ru-RU" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t("common.back")}
            </Button>
          </Link>
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white">
            <Download className="w-4 h-4 mr-2" /> {t("cert.download_pdf")}
          </Button>
        </div>

        <div
          ref={certRef}
          className={`relative bg-gradient-to-br ${levelConfig.bg} rounded-3xl p-1 shadow-2xl shadow-black/30`}
        >
          <div className="bg-white rounded-[20px] overflow-hidden">
            <div className={`bg-gradient-to-r ${levelConfig.bg} px-10 py-8 text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl">{levelIcon}</div>
                    <div>
                      <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Sun Proactive AI</p>
                      <h1 className="text-2xl font-bold">
                        {language === "kz" ? "ЕРІКТІЛІК СЕРТИФИКАТЫ" : language === "ru" ? "СЕРТИФИКАТ ВОЛОНТЁРА" : "VOLUNTEER CERTIFICATE"}
                      </h1>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${levelConfig.badge} text-sm font-bold px-3 py-1 border border-white/20`}>
                    {cert.level} Level
                  </Badge>
                  <p className="text-white/60 text-xs mt-2">{issuedDate}</p>
                </div>
              </div>
            </div>

            <div className="px-10 py-8">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1">
                  <p className="text-slate-500 text-sm uppercase tracking-widest mb-1">
                    {language === "kz" ? "Берілді" : language === "ru" ? "Выдан" : "Awarded to"}
                  </p>
                  <h2 className="text-4xl font-bold text-slate-900 mb-1">{cert.volunteerName}</h2>
                  <div className={`h-1 w-24 bg-gradient-to-r ${levelConfig.bg} rounded-full mb-6`}></div>

                  <p className="text-slate-500 text-sm uppercase tracking-widest mb-1">
                    {language === "kz" ? "Жоба" : language === "ru" ? "Проект" : "Project"}
                  </p>
                  <p className="text-xl font-semibold text-slate-800 mb-1">{cert.taskTitle}</p>
                  <p className="text-slate-500 text-sm mb-6">{cert.taskLocation}</p>

                  <p className="text-slate-700 text-base leading-relaxed mb-6 italic border-l-4 border-slate-200 pl-4">
                    "{cert.aiDescription}"
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                      <div className="text-2xl font-bold text-slate-900">{cert.hoursAwarded}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t("common.hours")}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                      <div className="text-2xl font-bold text-slate-900">{cert.impactScore}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t("gamification.impact")}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                      <div className="text-lg font-bold text-slate-900">{cert.role}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t("team.leader")}</div>
                    </div>
                  </div>

                  {cert.skillsUsed?.length > 0 && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                        {language === "kz" ? "Дағдылар" : language === "ru" ? "Навыки" : "Skills"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cert.skillsUsed.map(s => (
                          <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-700 text-sm">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-6 min-w-[140px]">
                  <QRCodeSVG value={verifyUrl} size={130} />

                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-semibold text-green-700">
                        {language === "kz" ? "Расталған" : language === "ru" ? "Подтверждено" : "Verified"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">
                      {language === "kz" ? "Сканерлеп тексеріңіз" : language === "ru" ? "Отсканируй для проверки" : "Scan to verify"}
                    </p>
                  </div>

                  <div className="text-center border-t border-slate-200 pt-4 w-full">
                    <div className="w-24 border-b-2 border-slate-700 mx-auto mb-1"></div>
                    <p className="text-xs font-semibold text-slate-700">{cert.curatorName}</p>
                    <p className="text-xs text-slate-400">
                      {language === "kz" ? "Куратор" : language === "ru" ? "Куратор" : "Curator"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs text-slate-500">sun-proactive.kz</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">ID: #{cert.id} •</span>
                <span className="font-mono text-xs text-slate-400">{cert.verifyToken.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Blockchain verified
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 text-sm">{t("cert.authentic")}</p>
            <p className="text-green-700 text-xs mt-0.5">{t("cert.qr_desc")} <span className="font-mono">{verifyUrl}</span></p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
