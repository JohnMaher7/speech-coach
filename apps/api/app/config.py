from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    r2_account_id: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_bucket: str

    deepgram_api_key: str

    anthropic_api_key: str

    database_url: str

    # Clerk handles login. The backend never sees a password — it only
    # verifies the short-lived session JWT the browser sends as a Bearer
    # token. `clerk_secret_key` lets the SDK fetch Clerk's public keys;
    # `clerk_authorized_parties` is the allowlist of frontend origins a
    # token is allowed to have been minted for (defends against a token
    # from a different Clerk app being replayed here).
    clerk_secret_key: str
    clerk_authorized_parties: str = "http://localhost:3000"

    # Slug of the legacy Clerk Billing plan. Subscribers who signed up before
    # the move to Stripe keep access while their session token carries this
    # plan in its `pla` claim (trial included).
    billing_plan_slug: str = "pro"

    # Stripe billing. When unset (e.g. a dev box without Stripe keys) the
    # /billing routes return 503 and only comp + legacy access works.
    # `web_base_url` is where Checkout and the billing portal send users back.
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    web_base_url: str = "http://localhost:3000"

    # Feedback widget. Every message is saved to Postgres; when both are set,
    # it is also emailed to `feedback_to_email` through Resend. Without a
    # verified sending domain, Resend only delivers to the Resend account's
    # own address, so `feedback_to_email` must be that address.
    resend_api_key: str | None = None
    feedback_to_email: str | None = None
    feedback_from_email: str = "SpeakGrade <onboarding@resend.dev>"

    # Optional — when unset, Sentry init is a no-op (local dev / preview).
    sentry_dsn: str | None = None

    @property
    def r2_endpoint(self) -> str:
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"

    @property
    def clerk_authorized_party_list(self) -> list[str]:
        return [p.strip() for p in self.clerk_authorized_parties.split(",") if p.strip()]


settings = Settings()
