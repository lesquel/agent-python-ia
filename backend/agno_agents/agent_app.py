from agno.playground import Playground

from .agents import all_agents

agent_app = Playground(agents=all_agents).get_app()
