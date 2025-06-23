from pydantic_settings import BaseSettings



class AgentsSettings(BaseSettings):
    model_id: str = "llama-3.3-70b-versatile"
    groq_api_key: str

    web_agent_collection_name: str = "web_agent"
    finance_agent_collection_name: str = "finance_agent"
    hackernews_agent_collection_name: str = "hackernews_team_agent"
    wikipedia_agent_collection_name: str = "wikipedia_agent"
    python_agent_collection_name: str = "python_agent"

    
    class Config:
        env_file = "core/envs/.agents.env"

