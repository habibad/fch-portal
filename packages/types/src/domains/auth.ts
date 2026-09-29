import { z } from "zod"

// --- ENUMS ---
export const UserStatusEnum = z.enum([
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
  "BANNED",
])
export type UserStatus = z.infer<typeof UserStatusEnum>

export const MembershipTypeEnum = z.enum(["GENERAL", "PASTORAL"])
export type MembershipType = z.infer<typeof MembershipTypeEnum>

export const MembershipStatusEnum = z.enum([
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELED",
  "FAILED",
])
export type MembershipStatus = z.infer<typeof MembershipStatusEnum>

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIAL_REFUNDED",
])
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>

// --- USER & SESSION ---

export const ZCIUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  status: UserStatusEnum.default("ACTIVE"),
  passwordChangeRequired: z.boolean().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type ZTUser = z.infer<typeof ZCIUserSchema>

export const ZCISessionSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  userId: z.string(),
})
export type ZTCSession = z.infer<typeof ZCISessionSchema>

// Base schemas (used inside UserOutput — defined here to avoid circular deps)
export const ZCICMembershipSchema = z.object({
  id: z.string(),
  type: MembershipTypeEnum,
  status: MembershipStatusEnum,
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
})
export type ZTCMembership = z.infer<typeof ZCICMembershipSchema>

export const ZCICPaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  status: PaymentStatusEnum,
  createdAt: z.coerce.date(),
})
export type ZTCCPayment = z.infer<typeof ZCICPaymentSchema>

// Extended User with relationships (used in user profiles/lists)
export const ZCIUserOutputSchema = ZCIUserSchema.extend({
  roles: z.array(z.string()),
  memberships: z.array(ZCICMembershipSchema),
  payments: z.array(ZCICPaymentSchema),
})
export type ZTCIUserOutput = z.infer<typeof ZCIUserOutputSchema>

// --- AUTH API PAYLOADS ---

export const ZCICAuthResponseSchema = z.object({
  token: z.string().optional(),
  redirect: z.boolean().optional(),
  user: ZCIUserSchema.optional(),
  requiresOtp: z.boolean().optional(),
})
export type ZTCIAuthResponse = z.infer<typeof ZCICAuthResponseSchema>

export const ZCICMeResponseSchema = z
  .object({
    session: ZCISessionSchema,
    user: ZCIUserSchema,
  })
  .nullable()
export type ZTCMeResponse = z.infer<typeof ZCICMeResponseSchema>

export const ZCRegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm password is required" }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Must accept terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type ZTCRegisterSchema = z.infer<typeof ZCRegisterSchema>


export const ZCLoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  rememberMe: z.boolean().optional(),
  acceptTerms: z.boolean().optional(),
})

export type ZTCLoginSchema = z.infer<typeof ZCLoginSchema>

export const ZCWebLoginSchema = ZCLoginSchema.extend({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Must accept terms and conditions",
  }),
})

export type ZTCWebLoginSchema = z.infer<typeof ZCWebLoginSchema>

