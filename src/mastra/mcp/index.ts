import { MCPServer } from "@mastra/mcp"
import { getDraftsTool,sendMailTool , ImportantEmailsTool, getUnreadEmailTool, createDraftTool } from "../tools";
import { personalMailAgent } from "../agents";
import { get } from "http";

export const server = new MCPServer({
  name: "My Custom Server",
  version: "1.0.0",
  tools: { getDraftsTool,sendMailTool,ImportantEmailsTool,getUnreadEmailTool,createDraftTool}, // this tool will be available to co-agents
  agents: {  personalMailAgent }, // this agent will become tool "ask_weatherAgent"
  // workflows: {
  // dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  // }
});
