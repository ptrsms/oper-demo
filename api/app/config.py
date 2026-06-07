from functools import lru_cache
from urllib.parse import urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_database_url(url: str) -> str:
    """Vercel/Neon expose `postgresql://...?sslmode=require`. asyncpg wants
    `postgresql+asyncpg://...` and ignores `sslmode` (we set ssl via connect_args).
    """
    if not url:
        return url
    parts = urlsplit(url)
    scheme = parts.scheme
    if scheme == "postgres":
        scheme = "postgresql"
    if scheme == "postgresql":
        scheme = "postgresql+asyncpg"
    # drop sslmode from query — asyncpg handles SSL via connect_args
    query = "&".join(p for p in parts.query.split("&") if p and not p.startswith("sslmode="))
    return urlunsplit((scheme, parts.netloc, parts.path, query, parts.fragment))


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/oper_credits"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24  # 24h
    cors_origins: list[str] = [
        "http://localhost:4200",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def normalized_database_url(self) -> str:
        return _normalize_database_url(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
