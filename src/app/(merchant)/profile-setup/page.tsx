"use client";

// Profile setup — new screen 03 from the Claude Design mockup, shown once right after first
// login. Answers the "don't we need a merchant registration view" gap: a display name is what
// lets the buyer's checkout say "Paying {name}" instead of something anonymous. Skippable —
// nothing here blocks the merchant from creating products without it.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera } from "@phosphor-icons/react/dist/ssr";
import { saveProfile, markProfileSetupSeen } from "@/lib/store";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAvatarClick() {
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function finish() {
    saveProfile({ displayName: name.trim(), avatarDataUrl: avatar, waNumber: wa.trim() || undefined });
    markProfileSetupSeen();
    router.replace("/dashboard");
  }

  function skip() {
    markProfileSetupSeen();
    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col p-6 animate-fade-up">
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <Image src="/hello-wave.png" alt="" width={132} height={132} className="animate-float" />
          <h1 className="font-display mt-1 text-[28px] font-extrabold tracking-tight text-ink">
            Say hi to your buyers
          </h1>
          <p className="text-[14.5px] leading-relaxed text-muted">
            A name and photo make your checkout feel personal. Takes ten seconds — you can change
            it anytime.
          </p>
        </div>

        <div className="flex justify-center py-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={handleAvatarClick}
            className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-primary/35 bg-primary/5 transition-transform active:scale-95"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- data: URL from FileReader, next/image doesn't support it
              <img src={avatar} alt="Profile" width={88} height={88} className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-primary">
                <Camera className="text-2xl" />
                <span className="text-[10.5px] font-semibold">Add photo</span>
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-4 py-2.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink">Business or display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Studio Mira"
              className="h-[52px] rounded-[13px] border-[1.5px] border-line bg-white px-4 text-[15px] text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none"
            />
            <p className="text-xs text-muted">Buyers will see &quot;Paying {name.trim() || "Your business"}&quot;</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink">
              WhatsApp number <span className="font-normal text-muted">· optional</span>
            </label>
            <input
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              placeholder="+62 812 …"
              className="h-[52px] rounded-[13px] border-[1.5px] border-line bg-white px-4 text-[15px] text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,42,107,0.12)] focus:outline-none"
            />
            <p className="text-xs text-muted">Lets buyers reach you if they have a question.</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-2.5 pb-3">
          <button
            onClick={finish}
            disabled={!name.trim()}
            className="h-[52px] rounded-2xl bg-primary text-[15.5px] font-semibold text-white transition-transform active:scale-[.97] disabled:opacity-45"
          >
            Continue
          </button>
          <button onClick={skip} className="h-11 rounded-xl text-sm font-medium text-muted transition-colors hover:bg-black/[.04]">
            Skip for now
          </button>
        </div>
    </div>
  );
}
