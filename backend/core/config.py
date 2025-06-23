from .settings import AppSettings, DatabaseSettings, JWTSettings, AgentsSettings


class Settings:
    app = AppSettings()
    database = DatabaseSettings()
    jwt = JWTSettings()
    agents = AgentsSettings()


settings = Settings()
