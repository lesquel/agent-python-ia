from agno.agent import Agent
from agno.playground import Playground, serve_playground_app
from agno.storage.sqlite import SqliteStorage
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.yfinance import YFinanceTools
from agno.tools.hackernews import HackerNewsTools
from agno.tools.wikipedia import WikipediaTools
from agno.tools.python import PythonTools
from agno.models.groq import Groq
from fastapi.middleware.cors import CORSMiddleware

agent_storage: str = "tmp/agents.db"

web_agent = Agent(
    name="Web Agent",
    model=Groq(id="llama-3.3-70b-versatile"),
    tools=[DuckDuckGoTools()],
    instructions=["Always include sources"],
    description="Web Agent is a knowledgeable agent that can answer questions about the web.",
    storage=SqliteStorage(table_name="web_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

finance_agent = Agent(
    name="Finance Agent",
    model=Groq(id="llama-3.3-70b-versatile"),
    tools=[YFinanceTools(
        stock_price=True,
        analyst_recommendations=True,
        company_info=True,
        company_news=True
    )],
    instructions=["Always use tables to display data"],
    description="Finance Agent is a financial expert that can answer questions about finance.",
    storage=SqliteStorage(table_name="finance_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

hackernews_team_agent = Agent(
    name="Hackernews Team",
    model=Groq(id="llama-3.3-70b-versatile"),
    tools=[HackerNewsTools()],
    instructions=["Always include sources"],
    description="Hackernews Team is a group of hackernews agents that can answer questions about Hackernews.",
    storage=SqliteStorage(table_name="hackernews_team", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

wikipedia_agent = Agent(
    name="Wikipedia Agent",
    model=Groq(id="llama-3.3-70b-versatile"),
    tools=[WikipediaTools()],
    instructions=["Always include sources"],
    description="Wikipedia Agent is a knowledgeable agent that can answer questions about Wikipedia.",
    storage=SqliteStorage(table_name="wikipedia_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

python_agent = Agent(
    name="Python Agent",
    model=Groq(id="llama-3.3-70b-versatile"),
    tools=[PythonTools()],
    instructions=["Always include sources"],
    description="Python Agent is a knowledgeable agent that can answer questions about Python.",
    storage=SqliteStorage(table_name="python_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

app = Playground(agents=[
    web_agent, 
    finance_agent, 
    hackernews_team_agent, 
    wikipedia_agent,
    python_agent
]).get_app()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    serve_playground_app("002:app", reload=True)