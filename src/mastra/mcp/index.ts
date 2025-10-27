import { MCPServer } from "@mastra/mcp"
import { getDraftsTool, updateDraftTool, } from "../tools";
import { personalagent } from "../agents";
import { get } from "http";

export const server = new MCPServer({
  name: "My Custom Server",
  version: "1.0.0",
  tools: { getDraftsTool,updateDraftTool }, // this tool will be available to co-agents
  agents: {  personalagent }, // this agent will become tool "ask_weatherAgent"
  // workflows: {
  // dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  // }
});
