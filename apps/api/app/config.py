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

    # Optional — when unset, Sentry init is a no-op (local dev / preview).
    sentry_dsn: str | None = None

    @property
    def r2_endpoint(self) -> str:
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"


settings = Settings()
