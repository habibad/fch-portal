"use client"

import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { useLogin } from "@/hooks/useAuth"
import { authClient } from "@/lib/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { ZCWebLoginSchema, ZTCWebLoginSchema } from "@workspace/types/index"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { toast } from "@workspace/ui/components/sonner"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [requiresOtp, setRequiresOtp] = useState<boolean>(false)
  const [otpCode, setOtpCode] = useState<string>("")

  const router = useRouter()
  const t = useTranslations("auth.login")

  const { mutate: login, isPending: isLoginPending } = useLogin()

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL:
          process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:3001/",
      })
      if (error) {
        throw new Error(error.message || "Google sign-in failed")
      }
    },
  })

  const form = useForm<ZTCWebLoginSchema>({
    resolver: zodResolver(ZCWebLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
      acceptTerms: false,
    },
  })

  const onSubmit = (data: ZTCWebLoginSchema) => {
    login(
      {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        otp: otpCode || undefined,
      },
      {
        onSuccess: (res) => {
          if (res.requiresOtp) {
            toast.success("Correct password! OTP sent to your email.")
            setRequiresOtp(true)
          } else {
            toast.success("Signed in successfully!")
            window.location.href =
              process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:3001/"
          }
        },
        onError: (err: Error) => {
          const errMsg = err.message || ""
          if (
            errMsg.toLowerCase().includes("user not found") ||
            errMsg.toLowerCase().includes("not found") ||
            errMsg.toLowerCase().includes("register")
          ) {
            toast.error("User not found, please register first.")
            router.push("/registation")
          } else {
            toast.error(errMsg || "Invalid email or password.")
          }
        },
      }
    )
  }

  const onGoogleLogin = () => {
    googleLoginMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Signed in with Google successfully!")
      },
      onError: (err: Error) => {
        const errMsg = err.message || ""
        if (
          errMsg.toLowerCase().includes("user not found") ||
          errMsg.toLowerCase().includes("not found") ||
          errMsg.toLowerCase().includes("register")
        ) {
          toast.error("User not found, please register first.")
          router.push("/registation")
        } else {
          toast.error(errMsg || "Google sign-in failed.")
        }
      },
    })
  }

  const isLoading = isLoginPending || googleLoginMutation.isPending

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 font-sans text-foreground transition-colors duration-300">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[500px] rounded-2xl border border-border/60 bg-card p-8 text-card-foreground shadow-xl backdrop-blur-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="font-trajan text-3xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            {/* Email Field */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="space-y-1.5"
                >
                  <FieldLabel
                    htmlFor="login-email"
                    className="text-sm font-medium tracking-wide text-foreground/90"
                  >
                    {t("emailLabel")}
                  </FieldLabel>
                  <div className="group relative">
                    <span className="absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <Mail size={18} />
                    </span>
                    <Input
                      {...field}
                      id="login-email"
                      placeholder="name@example.com"
                      type="email"
                      disabled={isLoading || requiresOtp}
                      aria-invalid={fieldState.invalid}
                      className="flex h-11 w-full rounded-md border border-input bg-background/50 py-2 pr-3 pl-11 text-sm ring-offset-background transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none"
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {requiresOtp ? (
              <div className="flex animate-in flex-col items-center justify-center space-y-3 py-3 duration-300 zoom-in-95 fade-in">
                <Field className="flex w-full flex-col items-center justify-center space-y-3">
                  <FieldLabel className="w-full text-left text-sm font-medium tracking-wide text-foreground/90">
                    Verification Code (OTP)
                  </FieldLabel>
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={isLoading}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="flex h-12 w-12 items-center justify-center rounded-md border border-input bg-background/50 text-lg font-bold shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
              </div>
            ) : (
              <>
                {/* Password Field */}
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <FieldLabel
                          htmlFor="login-password"
                          className="text-sm font-medium tracking-wide text-foreground/90"
                        >
                          {t("passwordLabel")}
                        </FieldLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-secondary-foreground transition-colors hover:underline"
                        >
                          {t("forgotPassword")}
                        </Link>
                      </div>
                      <div className="group relative">
                        <span className="absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                          <Lock size={18} />
                        </span>
                        <Input
                          {...field}
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                          className="flex h-11 w-full rounded-md border border-input bg-background/50 py-2 pr-11 pl-11 text-sm ring-offset-background transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 z-10 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Remember Me Field */}
                <Controller
                  name="rememberMe"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="horizontal"
                      className="items-center space-y-0 space-x-2 py-0.5"
                    >
                      <Checkbox
                        id="login-rememberMe"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        aria-invalid={fieldState.invalid}
                        className="shrink-0 border-primary"
                      />
                      <FieldLabel
                        htmlFor="login-rememberMe"
                        className="cursor-pointer text-xs leading-none font-medium text-muted-foreground select-none"
                      >
                        {t("rememberMe")}
                      </FieldLabel>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Terms Checkbox */}
                <Controller
                  name="acceptTerms"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="horizontal"
                      className="items-center space-y-0 space-x-2 py-0.5"
                    >
                      <Checkbox
                        id="login-terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        aria-invalid={fieldState.invalid}
                        className="shrink-0 border-primary"
                      />
                      <div className="space-y-1 leading-none">
                        <FieldLabel
                          htmlFor="login-terms"
                          className="cursor-pointer text-xs leading-normal font-medium text-muted-foreground"
                        >
                          {t("agreeTerms")}{" "}
                          <Link
                            href="/terms"
                            className="font-semibold text-primary hover:underline"
                          >
                            {t("termsOfService")}
                          </Link>{" "}
                          {t("and")}{" "}
                          <Link
                            href="/privacy"
                            className="font-semibold text-primary hover:underline"
                          >
                            {t("privacyPolicy")}
                          </Link>
                        </FieldLabel>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </div>
                    </Field>
                  )}
                />
              </>
            )}
          </FieldGroup>

          <Button
            type="submit"
            disabled={isLoading || (requiresOtp && otpCode.length < 6)}
            className="h-11 w-full cursor-pointer font-medium shadow-md shadow-primary/20 transition-all active:scale-[0.99]"
          >
            <span className="flex w-full items-center justify-center gap-2">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {requiresOtp ? "Verify & Login" : t("signIn")}
              {!isLoading && (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              )}
            </span>
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground uppercase">
            <span className="bg-card px-3">{t("orContinueWith")}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onGoogleLogin}
          className="h-11 w-full cursor-pointer gap-2 border border-border/40 font-medium transition-all hover:bg-secondary/80"
          disabled={isLoading}
        >
          <svg
            viewBox="-3 0 262 262"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid"
            fill="#000000"
            className="h-4 w-4"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                fill="#4285F4"
              ></path>
              <path
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                fill="#34A853"
              ></path>
              <path
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                fill="#FBBC05"
              ></path>
              <path
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                fill="#EB4335"
              ></path>
            </g>
          </svg>
          Continue with Google
        </Button>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/registation"
            className="font-semibold text-primary transition-colors hover:underline"
          >
            {t("signUp")}
          </Link>
        </div>
      </div>
    </div>
  )
}
