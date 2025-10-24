import { MCPServer } from "@mastra/mcp"
import { 
  emailTool, 
  weatherTool,
  prioritizedEmailTool,
  unsubscribeTool,
  getDraftsTool,
  createDraftTool,
  sendMessageTool
} from "../tools";
import { PersonalAgent, weatherAgent } from "../agents";

export const server = new MCPServer({
  name: "Gmail Management Server",
  version: "1.0.0",
  tools: { 
    // Weather functionality
    weatherTool,
    
    // Email management tools
    emailTool,
    prioritizedEmailTool,
    unsubscribeTool,
    getDraftsTool,
    createDraftTool,
    sendMessageTool
  },
  agents: { 
    weatherAgent,
    PersonalAgent 
  },
  // workflows: {
  // dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  // }
});
