export interface Tool {
  name: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  requires_confirmation: boolean;
  external_execution: boolean;
}

export interface Model {
  name: string;
  model: string;
  provider: string;
}

export interface Storage {
  name: string;
}

export interface AgentModel {
  agent_id: string;
  name: string;
  model: Model;
  add_context: boolean;
  tools: Tool[];
  memory: any | null;
  storage: Storage;
  knowledge: any | null;
  description: string | null;
  instructions: string[];
}
