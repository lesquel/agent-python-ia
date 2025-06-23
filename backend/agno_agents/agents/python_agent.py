from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.python import PythonTools
from agno.storage.mongodb import MongoDbStorage

from core.config import settings

python_agent = Agent(
    agent_id="python_agent",
    name="Python Agent",
    model=Groq(id=settings.agents.model_id, api_key=settings.agents.groq_api_key),
    tools=[PythonTools()],
    instructions=["Always include sources"],
    description="Python Agent is a knowledgeable agent that can answer questions about Python.",
    storage=MongoDbStorage(
        collection_name=settings.agents.python_agent_collection_name,
        db_url=settings.database.mongodb_uri,
    ),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)
