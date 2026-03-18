import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class GstackPlusPlus implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'gstack++',
    name: 'gstackPlusPlus',
    icon: 'file:gstack-icon.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with gstack++ C++ workflow skills',
    defaults: {
      name: 'gstack++',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'httpHeaderAuth',
        required: true,
        testedBy: 'httpHeaderAuthTest',
      },
    ],
    properties: [
      {
        displayName: 'gstack++ Base URL',
        name: 'gstackBaseUrl',
        type: 'string',
        default: '',
        placeholder: 'http://localhost:34567',
        required: true,
        description: 'Base URL of the gstack++ browse server',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Code Review',
            value: 'review',
            description: 'Pre-landing PR review for memory safety and UB',
            action: 'Run code review',
          },
          {
            name: 'QA Pipeline',
            value: 'qa',
            description: 'Build, test, analyze, and fix',
            action: 'Run QA pipeline',
          },
          {
            name: 'Ship',
            value: 'ship',
            description: 'One-command ship with PR creation',
            action: 'Ship code',
          },
          {
            name: 'Browse Command',
            value: 'browse',
            description: 'Execute a browse command',
            action: 'Execute browse command',
          },
        ],
        default: 'review',
      },
      // Review operation fields
      {
        displayName: 'Branch',
        name: 'branch',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['review', 'qa', 'ship'],
          },
        },
        placeholder: 'feature-branch',
        description: 'Git branch to operate on (default: current branch)',
      },
      {
        displayName: 'Base Branch',
        name: 'base',
        type: 'string',
        default: 'main',
        displayOptions: {
          show: {
            operation: ['review', 'ship'],
          },
        },
        description: 'Base branch to diff against',
      },
      // QA operation fields
      {
        displayName: 'Sanitizers',
        name: 'sanitizers',
        type: 'multiOptions',
        default: ['address', 'undefined'],
        displayOptions: {
          show: {
            operation: ['qa'],
          },
        },
        options: [
          { name: 'AddressSanitizer', value: 'address' },
          { name: 'UndefinedBehaviorSanitizer', value: 'undefined' },
          { name: 'ThreadSanitizer', value: 'thread' },
        ],
        description: 'Sanitizers to run',
      },
      {
        displayName: 'Run Valgrind',
        name: 'runValgrind',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            operation: ['qa'],
          },
        },
        description: 'Whether to run valgrind memcheck (Linux only)',
      },
      // Ship operation fields
      {
        displayName: 'PR Title',
        name: 'prTitle',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['ship'],
          },
        },
        placeholder: 'Add new feature',
        description: 'Pull request title (default: auto-generated)',
      },
      {
        displayName: 'PR Body',
        name: 'prBody',
        type: 'string',
        default: '',
        typeOptions: {
          rows: 4,
        },
        displayOptions: {
          show: {
            operation: ['ship'],
          },
        },
        placeholder: 'This PR adds...',
        description: 'Pull request description (default: auto-generated)',
      },
      // Browse operation fields
      {
        displayName: 'Command',
        name: 'browseCommand',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['browse'],
          },
        },
        placeholder: 'snapshot',
        description: 'Browse command to execute (goto, click, fill, snapshot, etc.)',
      },
      {
        displayName: 'Arguments',
        name: 'browseArgs',
        type: 'string',
        default: '',
        typeOptions: {
          rows: 2,
        },
        displayOptions: {
          show: {
            operation: ['browse'],
          },
        },
        placeholder: '-i',
        description: 'Command arguments (space-separated)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const gstackBaseUrl = this.getNodeParameter('gstackBaseUrl', i) as string;
        
        let command: string;
        let body: IDataObject = {};

        if (operation === 'review') {
          command = 'review';
          body = {
            command: 'review',
            branch: this.getNodeParameter('branch', i) as string || undefined,
            base: this.getNodeParameter('base', i) as string || 'main',
          };
        } else if (operation === 'qa') {
          command = 'qa';
          body = {
            command: 'qa',
            branch: this.getNodeParameter('branch', i) as string || undefined,
            sanitizers: this.getNodeParameter('sanitizers', i) as string[],
            runValgrind: this.getNodeParameter('runValgrind', i) as boolean,
          };
        } else if (operation === 'ship') {
          command = 'ship';
          body = {
            command: 'ship',
            branch: this.getNodeParameter('branch', i) as string || undefined,
            base: this.getNodeParameter('base', i) as string || 'main',
            prTitle: this.getNodeParameter('prTitle', i) as string || undefined,
            prBody: this.getNodeParameter('prBody', i) as string || undefined,
          };
        } else if (operation === 'browse') {
          command = 'browse';
          const browseCommand = this.getNodeParameter('browseCommand', i) as string;
          const browseArgs = this.getNodeParameter('browseArgs', i) as string;
          body = {
            command: 'browse',
            browseCommand,
            args: browseArgs ? browseArgs.split(' ') : [],
          };
        } else {
          throw new Error(`Unknown operation: ${operation}`);
        }

        // Execute gstack++ command via HTTP
        const response = await this.helpers.httpRequest({
          method: 'POST',
          url: `${gstackBaseUrl}/command`,
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });

        returnData.push({
          json: {
            success: true,
            operation,
            result: response,
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              success: false,
              error: error.message,
            },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
