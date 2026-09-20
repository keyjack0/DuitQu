/** Merender ilustrasi untuk setiap langkah onboarding. */
import Image from "next/image";
import type { OnboardingIllustration, OnboardingVisualKind } from "./onboardingData";

export function OnboardingVisual({ kind, image }: { kind: OnboardingVisualKind; image: OnboardingIllustration }) {
  return (
    <div className="onboarding-visual" data-visual={kind} aria-hidden="true">
      <Image
        className="onboarding-illustration"
        src={image.src}
        width={image.width}
        height={image.height}
        alt=""
        sizes="(max-width: 359px) 240px, 280px"
        loading="eager"
        draggable={false}
      />
    </div>
  );
}
