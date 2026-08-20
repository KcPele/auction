import { REGISTER_STEPS } from "./register.config";

export function RegisterProgress({ currentStep }: { currentStep: number }) {
  return (
    <div aria-label="Registration progress" className="mb-6">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Step {currentStep + 1} of {REGISTER_STEPS.length}</span>
        <span>{REGISTER_STEPS[currentStep].label}</span>
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {REGISTER_STEPS.map(({ label }, index) => {
          const active = index <= currentStep;
          return (
            <li
              key={label}
              aria-current={index === currentStep ? "step" : undefined}
              className="space-y-2"
            >
              <div
                className={`h-1 rounded-full transition-colors ${active ? "bg-primary" : "bg-surface-2"}`}
              />
              <span className={index === currentStep ? "text-xs font-semibold text-foreground" : "text-xs text-muted-foreground"}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
