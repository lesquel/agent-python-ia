from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.wikipedia import WikipediaTools
from agno.storage.mongodb import MongoDbStorage

from core.config import settings

wikipedia_agent = Agent(
    agent_id="wikipedia_agent",
    name="Wikipedia Agent",
    model=Groq(id=settings.agents.model_id, api_key=settings.agents.groq_api_key),
    tools=[WikipediaTools()],
    instructions=["Always include sources"],
    description="Wikipedia Agent is a knowledgeable agent that can answer questions about Wikipedia.",
    storage=MongoDbStorage(
        collection_name=settings.agents.wikipedia_agent_collection_name,
        db_url=settings.database.mongodb_uri,
    ),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)
