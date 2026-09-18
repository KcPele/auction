import { Eye, EyeOff, LockKeyhole, Mail, Tag } from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import type { usePasswordStrength } from "../hooks/usePasswordStrength";
import { Checkbox } from "../primitives/Checkbox";
import { Field, Input, PhoneInput } from "../primitives/Field";
import type { SignUpForm } from "../utils/auth.schema";

type RegisterFieldProps = {
  register: UseFormRegister<SignUpForm>;
  errors: FieldErrors<SignUpForm>;
};

export function AccountStep({ register, errors }: RegisterFieldProps) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Tell us about yourself</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use the name connected to your identity documents.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field htmlFor="register-first-name" label="First name" hint={errors.firstName?.message}>
          <Input autoComplete="given-name"  id="register-first-name" placeholder="Adaeze" {...register("firstName")} />
        </Field>
        <Field htmlFor="register-last-name" label="Last name" hint={errors.lastName?.message}>
          <Input autoComplete="family-name" id="register-last-name" placeholder="Okafor" {...register("lastName")} />
        </Field>
      </div>
      <Field
        htmlFor="register-email"
        label="Email address"
        hint={errors.email?.message}
        meta="Used for sign-in, verification, and account recovery."
      >
        <Input
          autoComplete="email"
          id="register-email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail aria-hidden="true" size={18} />}
          {...register("email")}
        />
      </Field>
    </div>
  );
}

export function ProfileStep({
  control,
  register,
  errors,
}: RegisterFieldProps & { control: Control<SignUpForm> }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Set up your auction profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose how you plan to use BidNaija.</p>
      </div>
      <Field htmlFor="register-phone" label="Phone number" hint={errors.phone?.message}>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput autoComplete="tel-national" id="register-phone" placeholder="812 345 6789" {...field} />
          )}
        />
      </Field>
      <Field htmlFor="register-role" label="Account type" hint={errors.appRole?.message}>
        <select
          id="register-role"
          {...register("appRole")}
          className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:bg-surface-subtle"
        >
          <option value="INDIVIDUAL_BIDDER">Individual bidder</option>
          <option value="CAR_DEALER">Car dealer</option>
          <option value="MECHANIC">Mechanic</option>
        </select>
      </Field>
      <Field htmlFor="register-referral" label="Referral code" hint="Optional">
        <Input
          id="register-referral"
          placeholder="BN-XXXX-XXXX"
          leftIcon={<Tag aria-hidden="true" size={18} />}
          {...register("referralCode")}
        />
      </Field>
    </div>
  );
}

export function SecurityStep({
  control,
  register,
  errors,
  showPassword,
  hasPassword,
  onTogglePassword,
  strength,
}: RegisterFieldProps & {
  control: Control<SignUpForm>;
  showPassword: boolean;
  hasPassword: boolean;
  onTogglePassword: () => void;
  strength: ReturnType<typeof usePasswordStrength>;
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Secure your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use at least eight characters and keep your password private.</p>
      </div>
      <Field
        htmlFor="register-password"
        label="Password"
        hint={
          errors.password?.message ??
          (hasPassword ? <span className={strength.labelColor}>{strength.label}</span> : undefined)
        }
      >
        <Input
          autoComplete="new-password"
          id="register-password"
          type={showPassword ? "text" : "password"}
          placeholder="8+ characters"
          leftIcon={<LockKeyhole aria-hidden="true" size={18} />}
          rightSlot={
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              type="button"
              onClick={onTogglePassword}
              className="rounded-md p-2 text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            >
              {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
            </button>
          }
          {...register("password")}
        />
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${index < strength.score ? strength.barClass : "bg-surface-2"}`}
            />
          ))}
        </div>
      </Field>
      <Controller
        control={control}
        name="accept"
        render={({ field }) => (
          <Checkbox checked={Boolean(field.value)} onChange={field.onChange}>
            I agree to BidNaija&apos;s bidder terms, escrow policy, and auction alerts.
          </Checkbox>
        )}
      />
      {errors.accept?.message && <p className="mt-1 text-xs text-danger">{errors.accept.message}</p>}
    </div>
  );
}
