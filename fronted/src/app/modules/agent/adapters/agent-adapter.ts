import { AgentModel } from '../models/agent-model';

export function adaptAgent(rawAgent: any): AgentModel {
  const agent = rawAgent;
  return {
    agent_id: agent.agent_id,
    name: agent.name,
    model: {
      name: agent.model.name,
      model: agent.model.model,
      provider: agent.model.provider,
    },
    add_context: agent.add_context,
    tools: agent.tools.map((tool: any) => ({
      name: tool.name,
      parameters: {
        type: tool.parameters.type,
        properties: tool.parameters.properties,
        required: tool.parameters.required,
      },
      requires_confirmation: tool.requires_confirmation,
      external_execution: tool.external_execution,
    })),
    memory: agent.memory,
    storage: {
      name: agent.storage.name,
    },
    knowledge: agent.knowledge,
    description: agent.description,
    instructions: agent.instructions,
  };
}

export function adaptAgents(rawAgents: any[]): AgentModel[] {
  return rawAgents.map((agent) => adaptAgent(agent));
}
