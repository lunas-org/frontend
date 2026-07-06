// Shared page shell — centers a phone-width "card" on a soft background. On an actual phone
// this just fills the viewport; on desktop it reads like a native app window, matching the
// Claude Design mockup's device-frame layout without hardcoding a fake phone bezel.

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-[#EEECE6]">
      <div className="relative min-h-screen w-full max-w-[430px] overflow-hidden bg-paper shadow-[0_24px_80px_rgba(21,22,27,0.10)]">
        {children}
      </div>
    </div>
  );
}
