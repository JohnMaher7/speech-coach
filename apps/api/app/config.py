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

    # Optional — when unset, Sentry init is a no-op (local dev / preview).
    sentry_dsn: str | None = None

    @property
    def r2_endpoint(self) -> str:
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"

    @property
    def clerk_authorized_party_list(self) -> list[str]:
        return [p.strip() for p in self.clerk_authorized_parties.split(",") if p.strip()]


settings = Settings()
