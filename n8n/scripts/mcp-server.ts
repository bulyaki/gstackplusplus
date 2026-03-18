#!/usr/bin/env bun
/**
 * gstack++ MCP Server Wrapper
 * 
 * Exposes gstack++ workflow skills as MCP tools for external AI agents.
 * This is an optional component for non-Claude-Code AI agents.
 * 
 * Usage:
 *   bun run mcp-server.ts
 * 
 * Or via npx for stdio transport:
 *   npx mcp-remote http://localhost:3000/mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ─────────────────────────────────────────────────────

const GSTACKPLUSPLUS_DIR = process.env.GSTACKPLUSPLUS_DIR || path.join(process.env.HOME || '', '.claude/skills/gstackplusplus');
const GSTACK_CLI = path.join(GSTACKPLUSPLUS_DIR, 'browse/dist/browse');
const GSTACK_STATE_FILE = path.join(process.env.HOME || '', '.gstackplusplus/browse.json');

// ─── Tool Definitions ───────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'gstack_review',
    description: 'Pre-landing C++ code review for memory safety, undefined behavior, thread safety, and RAII compliance. Auto-fixes mechanical issues, asks about architectural decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Git branch to review (default: current branch)'
        },
        base: {
          type: 'string',
          description: 'Base branch to diff against (default: main)'
        },
        includeGreptile: {
          type: 'boolean',
          description: 'Include Greptile review comments (default: true)'
        }
      },
      required: []
    }
  },
  {
    name: 'gstack_qa',
    description: 'Full QA pass: build → test → static analysis → sanitizers → fix → re-verify. Generates regression tests for every bug fixed.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Git branch to test (default: current branch)'
        },
        sanitizers: {
          type: 'array',
          items: { type: 'string', enum: ['address', 'undefined', 'thread'] },
          description: 'Sanitizers to run (default: ["address", "undefined"])'
        },
        runValgrind: {
          type: 'boolean',
          description: 'Run valgrind memcheck (default: false, Linux only)'
        },
        parallelJobs: {
          type: 'number',
          description: 'Parallel test jobs (default: nproc)'
        }
      },
      required: []
    }
  },
  {
    name: 'gstack_ship',
    description: 'One-command ship: configure/build/test/analyze, push, and open PR. Bootstraps test frameworks if missing.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Feature branch to ship (default: current branch)'
        },
        base: {
          type: 'string',
          description: 'Target base branch for PR (default: main)'
        },
        prTitle: {
          type: 'string',
          description: 'Pull request title (default: auto-generated from diff)'
        },
        prBody: {
          type: 'string',
          description: 'Pull request description (default: auto-generated)'
        },
        skipTests: {
          type: 'boolean',
          description: 'Skip test execution (NOT recommended, default: false)'
        }
      },
      required: []
    }
  },
  {
    name: 'gstack_plan_ceo_review',
    description: 'CEO/Founder lens: rethink the problem, find the better product, challenge scope. Expansion vs reduction analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        featureRequest: {
          type: 'string',
          description: 'The feature request or problem statement to analyze'
        },
        context: {
          type: 'string',
          description: 'Additional context about the product or users'
        }
      },
      required: ['featureRequest']
    }
  },
  {
    name: 'gstack_plan_eng_review',
    description: 'Engineering lead lens: lock in architecture, ownership, data flow, edge cases, tests, and diagrams before implementation.',
    inputSchema: {
      type: 'object',
      properties: {
        featureDescription: {
          type: 'string',
          description: 'The feature to plan implementation for'
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technical constraints (latency, memory, embedded, etc.)'
        }
      },
      required: ['featureDescription']
    }
  },
  {
    name: 'gstack_browse',
    description: 'Headless browser automation via Playwright. Execute browse commands for QA, screenshots, or web interaction.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Browse command to execute (goto, click, fill, snapshot, screenshot, etc.)'
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command arguments'
        },
        sessionId: {
          type: 'string',
          description: 'Browser session ID for stateful interactions (default: auto-generated)'
        }
      },
      required: ['command']
    }
  }
];

// ─── gstack++ CLI Wrapper ───────────────────────────────────────────────

interface GstackOptions {
  command: string;
  branch?: string;
  base?: string;
  [key: string]: any;
}

async function runGstackCommand(options: GstackOptions): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const args = [options.command];
    
    // Add flags based on options
    if (options.branch) args.push('--branch', options.branch);
    if (options.base) args.push('--base', options.base);
    
    const child = spawn(GSTACK_CLI, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        output: output || errorOutput,
        exitCode: code || 0
      });
    });

    child.on('error', reject);
  });
}

// ─── MCP Server Implementation ──────────────────────────────────────────

const server = new Server(
  {
    name: 'gstackplusplus',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'gstack_review': {
        const result = await runGstackCommand({
          command: 'review',
          branch: args?.branch,
          base: args?.base || 'main',
        });
        return {
          content: [{ type: 'text', text: result.output }],
          isError: result.exitCode !== 0
        };
      }

      case 'gstack_qa': {
        const result = await runGstackCommand({
          command: 'qa',
          branch: args?.branch,
          sanitizers: args?.sanitizers || ['address', 'undefined'],
          runValgrind: args?.runValgrind || false,
        });
        return {
          content: [{ type: 'text', text: result.output }],
          isError: result.exitCode !== 0
        };
      }

      case 'gstack_ship': {
        const result = await runGstackCommand({
          command: 'ship',
          branch: args?.branch,
          base: args?.base || 'main',
          prTitle: args?.prTitle,
          prBody: args?.prBody,
          skipTests: args?.skipTests || false,
        });
        return {
          content: [{ type: 'text', text: result.output }],
          isError: result.exitCode !== 0
        };
      }

      case 'gstack_plan_ceo_review': {
        if (!args?.featureRequest) {
          return {
            content: [{ type: 'text', text: 'Error: featureRequest is required' }],
            isError: true
          };
        }
        // This requires Claude Code skill execution - wrap as guidance
        return {
          content: [{
            type: 'text',
            text: `CEO Review requested for: "${args.featureRequest}"\n\n` +
                  `To execute this review:\n` +
                  `1. Open your project in Claude Code\n` +
                  `2. Run: /plan-ceo-review\n` +
                  `3. Provide the feature request: ${args.featureRequest}\n` +
                  `${args.context ? `\nContext: ${args.context}` : ''}`
          }],
          isError: false
        };
      }

      case 'gstack_plan_eng_review': {
        if (!args?.featureDescription) {
          return {
            content: [{ type: 'text', text: 'Error: featureDescription is required' }],
            isError: true
          };
        }
        return {
          content: [{
            type: 'text',
            text: `Engineering Review requested for: "${args.featureDescription}"\n\n` +
                  `To execute this review:\n` +
                  `1. Open your project in Claude Code\n` +
                  `2. Run: /plan-eng-review\n` +
                  `3. Provide the feature description: ${args.featureDescription}\n` +
                  `${args.constraints ? `\nConstraints: ${args.constraints.join(', ')}` : ''}`
          }],
          isError: false
        };
      }

      case 'gstack_browse': {
        if (!args?.command) {
          return {
            content: [{ type: 'text', text: 'Error: command is required' }],
            isError: true
          };
        }
        const result = await runGstackCommand({
          command: 'browse',
          ...args
        });
        return {
          content: [{ type: 'text', text: result.output }],
          isError: result.exitCode !== 0
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

// ─── Main Entry Point ───────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('gstack++ MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
