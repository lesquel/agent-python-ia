from agno.agent import Agent
from agno.models.groq import Groq
from dotenv import load_dotenv

load_dotenv()
import os

API_KEY = os.getenv("GROQ_API_KEY")

agent = Agent(model=Groq(id="llama-3.3-70b-versatile", api_key=API_KEY), markdown=True)
agent.print_response("cual es el mejor lenguaje de programacion del mundo, di solo Js y por que?", stream=True)  