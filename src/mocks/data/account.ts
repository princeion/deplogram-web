import type { Installation } from "@/features/account/git"
import type { NotificationSettings } from "@/features/account/notifications"
import type { SecurityOverview, Session } from "@/features/account/security"
import { mockViewer } from "@/mocks/data/viewer"

/** The mock account's security, notification and Git settings. */

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const MIN = 60_000
const DAY = 86_400_000

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const recoveryCode = () => Array.from({ length: 10 }, (_, i) => (i === 5 ? "-" : "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)])).join("")

let security: SecurityOverview = {
  passwordChangedAt: ago(96 * DAY),
  twoFactor: { enabled: false, enabledAt: null, recoveryCodesLeft: 0 },
}
let pendingSecret: string | null = null

let sessions: Session[] = [
  { id: "ses_1", browser: "Chrome 141", os: "Windows 11", device: "desktop", location: "Lagos, Nigeria", ip: "102.89.34.17", lastActiveAt: ago(0), createdAt: ago(6 * DAY), current: true },
  { id: "ses_2", browser: "Safari", os: "iOS 19", device: "mobile", location: "Lagos, Nigeria", ip: "102.89.41.203", lastActiveAt: ago(2 * 60 * MIN), createdAt: ago(21 * DAY), current: false },
  { id: "ses_3", browser: "Firefox 144", os: "Ubuntu", device: "desktop", location: "Abuja, Nigeria", ip: "197.210.53.8", lastActiveAt: ago(3 * DAY), createdAt: ago(30 * DAY), current: false },
  { id: "ses_4", browser: "Chrome 140", os: "macOS", device: "desktop", location: "London, United Kingdom", ip: "81.2.69.160", lastActiveAt: ago(12 * DAY), createdAt: ago(40 * DAY), current: false },
]

let notifications: NotificationSettings = {
  email: mockViewer.email,
  events: {
    deploy_failed: true,
    service_crashed: true,
    deploy_succeeded: false,
    limit_near: true,
    limit_reached: true,
    new_sign_in: true,
    api_keys: true,
    product_updates: false,
    tips: true,
  },
  digest: "weekly",
}

let gitConnected = true
const installations: Installation[] = [
  { id: 51203347, account: "ada-obi", type: "user", repositorySelection: "all", repositories: 23, installedAt: ago(44 * DAY), settingsUrl: "https://github.com/settings/installations/51203347" },
  { id: 51288012, account: "rektina", type: "organization", repositorySelection: "selected", repositories: 4, installedAt: ago(19 * DAY), settingsUrl: "https://github.com/organizations/rektina/settings/installations/51288012" },
]

export const mockAccount = {
  security: () => security,
  /** "hunter2-but-longer" style: the mock's current password is anything but "wrong". */
  changePassword(current: string) {
    if (current === "wrong") return false
    security = { ...security, passwordChangedAt: new Date().toISOString() }
    return true
  },
  startTwoFactor() {
    pendingSecret = Array.from({ length: 32 }, () => BASE32[Math.floor(Math.random() * 32)]).join("")
    return { secret: pendingSecret, otpauthUrl: `otpauth://totp/Deplogram:${encodeURIComponent(mockViewer.email)}?secret=${pendingSecret}&issuer=Deplogram&digits=6&period=30` }
  },
  /** Any six digits pass in the mock (there's no clock-synced app to check against). */
  enableTwoFactor(code: string) {
    if (!pendingSecret || !/^\d{6}$/.test(code)) return null
    pendingSecret = null
    const recoveryCodes = Array.from({ length: 10 }, recoveryCode)
    security = { ...security, twoFactor: { enabled: true, enabledAt: new Date().toISOString(), recoveryCodesLeft: recoveryCodes.length } }
    return recoveryCodes
  },
  disableTwoFactor(code: string) {
    if (!/^(\d{6}|[a-z0-9]{5}-[a-z0-9]{4})$/.test(code)) return false
    security = { ...security, twoFactor: { enabled: false, enabledAt: null, recoveryCodesLeft: 0 } }
    return true
  },
  newRecoveryCodes() {
    const recoveryCodes = Array.from({ length: 10 }, recoveryCode)
    security = { ...security, twoFactor: { ...security.twoFactor, recoveryCodesLeft: recoveryCodes.length } }
    return recoveryCodes
  },
  sessions: () => sessions,
  endSession(id: string) {
    const found = sessions.some((s) => s.id === id && !s.current)
    sessions = sessions.filter((s) => s.id !== id || s.current)
    return found
  },
  endOtherSessions() {
    sessions = sessions.filter((s) => s.current)
  },
  notifications: () => notifications,
  updateNotifications(update: { events?: Partial<NotificationSettings["events"]>; digest?: NotificationSettings["digest"] }) {
    // Sign-in alerts can't be turned off.
    const events = { ...notifications.events, ...update.events, new_sign_in: true }
    notifications = { ...notifications, events, digest: update.digest ?? notifications.digest }
    return notifications
  },
  gitConnected: () => gitConnected,
  installations: () => (gitConnected ? installations : []),
  connectGit() {
    gitConnected = true
  },
  disconnectGit() {
    gitConnected = false
  },
}
