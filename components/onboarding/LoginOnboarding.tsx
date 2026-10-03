"use client";

/** Menyajikan alur perkenalan interaktif sebelum pengguna membuka halaman masuk. */
import { useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OnboardingVisual } from "./OnboardingVisual";
import { onboardingSteps } from "./onboardingData";

export function LoginOnboarding({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const step = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;

  function goToStep(index: number) {
    const next = Math.max(0, Math.min(onboardingSteps.length - 1, index));
    setDirection(next < stepIndex ? "backward" : "forward");
    setStepIndex(next);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.pointerType === "mouse") return;
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goToStep(stepIndex + (dx < 0 ? 1 : -1));
    }
  }

  return (
    <main className="onboarding-page" aria-label="Perkenalan DuitQu">
      <div className="onboarding-shell">
        <header className="onboarding-header">
          <span className="onboarding-brand"><span className="onboarding-logo">D</span>DuitQu</span>
          {!isLastStep && <button type="button" className="onboarding-skip" onClick={onComplete}>Lewati</button>}
        </header>

        <div className="onboarding-content" onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }}>
          <section key={step.visual} className="onboarding-slide" data-direction={direction} aria-labelledby="onboarding-step-title">
            <OnboardingVisual kind={step.visual} image={step.image} />
            <div className="onboarding-panel">
              <div className="onboarding-copy" aria-live="polite" aria-atomic="true">
                <span className="sr-only">Langkah {stepIndex + 1} dari {onboardingSteps.length}. </span>
                <h1 id="onboarding-step-title">{step.title}</h1>
                <p>{step.description}</p>
              </div>

              <footer className="onboarding-footer">
                <nav className="onboarding-pagination" aria-label="Langkah perkenalan">
                  {onboardingSteps.map((item, index) => (
                    <button key={item.visual} type="button" className="onboarding-dot" aria-label={`Langkah ${index + 1}: ${item.title}`} aria-current={index === stepIndex ? "step" : undefined} onClick={() => goToStep(index)}><span /></button>
                  ))}
                </nav>
                <div className="onboarding-action">
                  {stepIndex > 0 && (
                    <button type="button" className="onboarding-previous" onClick={() => goToStep(stepIndex - 1)}>
                      <ArrowLeft size={20} aria-hidden="true" />
                      <span>Sebelumnya</span>
                    </button>
                  )}
                  <button type="button" className={`onboarding-next${isLastStep ? " onboarding-next--finish" : ""}`} aria-label={isLastStep ? undefined : "Langkah berikutnya"} title={isLastStep ? undefined : "Langkah berikutnya"} onClick={() => isLastStep ? onComplete() : goToStep(stepIndex + 1)}>
                    <span className={isLastStep ? undefined : "onboarding-next-label"}>{isLastStep ? "Mulai dengan DuitQu" : "Berikutnya"}</span>
                    <ArrowRight size={22} aria-hidden="true" />
                  </button>
                </div>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
