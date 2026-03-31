import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";

interface VerificationResult {
  status: "approved" | "rejected";
  confidence: number;
  reason: string;
  detectedElements: string[];
}

interface PhotoVerificationProps {
  applicationId: number;
}

export function PhotoVerification({ applicationId }: PhotoVerificationProps) {
  const { t } = useI18n();
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      setBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!base64 || !token) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/ai/verify-completion/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoBase64: base64 }),
      });
      if (!res.ok) throw new Error("Verification failed");
      const data: VerificationResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(t("common.error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-violet-200 bg-violet-50/30 shadow-md mt-4">
      <CardHeader className="pb-3 border-b border-violet-100">
        <CardTitle className="text-lg flex items-center gap-2 text-violet-900">
          <Camera className="w-5 h-5 text-violet-500" />
          {t("photo.title")}
        </CardTitle>
        <p className="text-sm text-violet-700/80">{t("photo.subtitle")}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-violet-300 rounded-xl p-8 text-center hover:bg-violet-50 transition-colors cursor-pointer"
          >
            <Upload className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-violet-700">{t("photo.upload_btn")}</p>
            <p className="text-xs text-violet-500 mt-1">JPG, PNG, WEBP</p>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-violet-200 shadow-sm">
              <img src={preview} alt="Upload preview" className="w-full h-48 object-cover" />
              <button
                onClick={() => { setPreview(null); setBase64(null); setResult(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
              >
                ✕
              </button>
            </div>

            {!result && (
              <Button
                onClick={handleVerify}
                disabled={isAnalyzing}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("photo.analyzing")}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    {t("photo.analyze_btn")}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-xl p-4 border ${result.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              {result.status === "approved" ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <p className={`font-semibold ${result.status === "approved" ? "text-green-800" : "text-red-800"}`}>
                {result.status === "approved" ? t("photo.approved") : `${t("photo.rejected")} ${result.reason}`}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 font-medium">{t("photo.confidence")}:</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${result.status === "approved" ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${Math.round(result.confidence * 100)}%` }}
                  />
                </div>
                <span className="font-bold text-slate-700">{Math.round(result.confidence * 100)}%</span>
              </div>

              {result.detectedElements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    {t("photo.detected")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.detectedElements.map((el, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-white border border-slate-200">
                        {el}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => { setPreview(null); setBase64(null); setResult(null); }}
            >
              {t("common.upload")} {t("photo.upload_btn").toLowerCase()}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
