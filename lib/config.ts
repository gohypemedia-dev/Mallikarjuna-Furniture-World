/**
 * Static configuration. The app no longer reads environment variables (.env) - every value that used to come
 * from `process.env` is read from this empty map instead, so each integration (database, SMTP, Razorpay,
 * Velocity, Delhivery, R2, SMS, Meta, GA4) falls back to its "not configured" branch.
 * Put real values here (or wire them to your own config source) when you connect a backend.
 */
export const env: Record<string, string | undefined> = {};
