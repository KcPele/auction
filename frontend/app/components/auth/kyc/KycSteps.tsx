import { AuthButton } from "../primitives/AuthButton";
import { Field, Input } from "../primitives/Field";
import { Icon } from "../primitives/Icon";
import type { KycFlowController } from "./useKycFlow";

function StepIntro({ title, children }: { title: string; children: string }) {
  return (
    <>
      <h1 className="mb-2 text-4xl font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{children}</p>
    </>
  );
}

export function NinStep({ flow }: { flow: KycFlowController }) {
  const { fields, pending, updateField } = flow;
  return (
    <>
      <StepIntro title="Verify your NIN.">
        Type your NIN exactly as registered to complete identity verification.
      </StepIntro>
      <Field label="NIN" hint="11 digits">
        <Input
          inputMode="numeric"
          maxLength={11}
          placeholder="12345678901"
          value={fields.nin}
          onChange={(event) =>
            updateField("nin", event.target.value.replace(/\D/g, ""))
          }
          leftIcon={<Icon name="shield" size={18} />}
        />
      </Field>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First name">
          <Input
            value={fields.ninFirst}
            placeholder="John"
            onChange={(event) => updateField("ninFirst", event.target.value)}
          />
        </Field>
        <Field label="Surname">
          <Input
            value={fields.ninSurname}
            placeholder="Doe"
            onChange={(event) => updateField("ninSurname", event.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date of birth">
          <Input
            type="date"
            value={fields.ninDob}
            onChange={(event) => updateField("ninDob", event.target.value)}
          />
        </Field>
        <Field label="Phone">
          <Input
            type="tel"
            placeholder="08123456789"
            value={fields.ninPhone}
            onChange={(event) => updateField("ninPhone", event.target.value)}
          />
        </Field>
      </div>
      <AuthButton
        type="button"
        disabled={pending.nin}
        onClick={flow.submitNin}
      >
        {pending.nin ? "Verifying…" : "Verify NIN"}{" "}
        <Icon name="arrow-r" size={16} strokeWidth={2} />
      </AuthButton>
    </>
  );
}

export function BvnStep({ flow }: { flow: KycFlowController }) {
  const { fields, pending, updateField } = flow;
  return (
    <>
      <StepIntro title="Verify your BVN.">
        We need your Bank Verification Number for secure payments.
      </StepIntro>
      <Field label="BVN" hint="11 digits">
        <Input
          inputMode="numeric"
          maxLength={11}
          placeholder="12345678901"
          value={fields.bvn}
          onChange={(event) =>
            updateField("bvn", event.target.value.replace(/\D/g, ""))
          }
          leftIcon={<Icon name="shield" size={18} />}
        />
      </Field>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First name">
          <Input
            value={fields.bvnFirstName}
            placeholder="John"
            onChange={(event) => updateField("bvnFirstName", event.target.value)}
          />
        </Field>
        <Field label="Last name">
          <Input
            value={fields.bvnLastName}
            placeholder="Doe"
            onChange={(event) => updateField("bvnLastName", event.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date of birth">
          <Input
            type="date"
            value={fields.bvnDob}
            onChange={(event) => updateField("bvnDob", event.target.value)}
          />
        </Field>
        <Field label="Phone number">
          <Input
            type="tel"
            placeholder="08123456789"
            value={fields.bvnPhone}
            onChange={(event) => updateField("bvnPhone", event.target.value)}
          />
        </Field>
      </div>
      <AuthButton
        type="button"
        disabled={pending.bvn}
        onClick={flow.submitBvn}
      >
        {pending.bvn ? "Verifying…" : "Verify BVN"}{" "}
        <Icon name="arrow-r" size={16} strokeWidth={2} />
      </AuthButton>
    </>
  );
}

export function BvnOtpStep({ flow }: { flow: KycFlowController }) {
  const { fields, pending, updateField } = flow;
  return (
    <>
      <StepIntro title="Confirm your BVN.">
        Enter the OTP sent by the identity provider to your registered phone.
      </StepIntro>
      <Field label="Registered phone number">
        <Input
          type="tel"
          value={fields.bvnPhone}
          readOnly
          leftIcon={<Icon name="phone" size={18} />}
        />
      </Field>
      <Field label="BVN verification OTP" hint="4–6 digits" className="mt-3">
        <Input
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={fields.otp}
          onChange={(event) =>
            updateField("otp", event.target.value.replace(/\D/g, ""))
          }
          leftIcon={<Icon name="key" size={18} />}
        />
      </Field>
      <AuthButton
        type="button"
        disabled={pending.bvnOtp}
        onClick={flow.submitBvnOtp}
      >
        {pending.bvnOtp ? "Confirming…" : "Confirm BVN"}{" "}
        <Icon name="arrow-r" size={16} strokeWidth={2} />
      </AuthButton>
    </>
  );
}

export function SubaccountStep({ flow }: { flow: KycFlowController }) {
  const { fields, pending, updateField } = flow;
  return (
    <>
      <StepIntro title="Payment account.">
        Create your payment subaccount to receive payouts when your items sell.
      </StepIntro>
      <Field label="State">
        <Input
          placeholder="Lagos"
          value={fields.subState}
          onChange={(event) => updateField("subState", event.target.value)}
        />
      </Field>
      <Field label="Address" className="mt-3">
        <Input
          placeholder="12 Marina Road, Lagos"
          value={fields.subAddress}
          onChange={(event) => updateField("subAddress", event.target.value)}
        />
      </Field>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Transaction PIN" hint="4–6 digits">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••"
            value={fields.subPin}
            onChange={(event) =>
              updateField("subPin", event.target.value.replace(/\D/g, ""))
            }
          />
        </Field>
        <Field label="Business name (optional)">
          <Input
            placeholder="KC Pele Auctions"
            value={fields.subBusiness}
            onChange={(event) => updateField("subBusiness", event.target.value)}
          />
        </Field>
      </div>
      <AuthButton
        type="button"
        disabled={pending.subaccount}
        onClick={flow.submitSubaccount}
      >
        {pending.subaccount ? "Creating…" : "Create account"}{" "}
        <Icon name="arrow-r" size={16} strokeWidth={2} />
      </AuthButton>
    </>
  );
}

export function KycSecurityNote() {
  return (
    <div className="mt-5 flex items-start gap-3.5 rounded-lg border border-border bg-surface p-3.5 text-xs leading-relaxed text-muted-foreground">
      <Icon name="lock" size={16} />
      <div>
        Encrypted in transit and at rest. Only used to verify identity — never
        shared with sellers or third parties.
      </div>
    </div>
  );
}
