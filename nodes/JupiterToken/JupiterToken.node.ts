import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class JupiterToken implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter Token',
		name: 'jupiterToken',
		icon: 'file:jupiterLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Jupiter Token API v2 operations',
		defaults: {
			name: 'Jupiter Token',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'jupiterApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: 'https://lite-api.jup.ag/tokens/v2',
				description: 'Base URL for Jupiter Token API v2',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search tokens by symbol, name, or mint address',
						action: 'Search tokens',
					},
					{
						name: 'Get by Tag',
						value: 'tag',
						description: 'Get tokens by tag (lst, verified)',
						action: 'Get tokens by tag',
					},
					{
						name: 'Get by Category',
						value: 'category',
						description: 'Get tokens by category and time interval',
						action: 'Get tokens by category',
					},
					{
						name: 'Get Recent',
						value: 'recent',
						description: 'Get tokens with recently created first pool',
						action: 'Get recent tokens',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Search Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'USDC, So11111111111111111111111111111111111111112, or token name',
				description: 'Search by symbol, name, or mint address. Multiple mint addresses separated by commas (max 100).',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'options',
				options: [
					{
						name: 'LST (Liquid Staking Tokens)',
						value: 'lst',
					},
					{
						name: 'Verified',
						value: 'verified',
					},
				],
				default: 'verified',
				description: 'Token tag to filter by',
				displayOptions: {
					show: {
						operation: ['tag'],
					},
				},
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				options: [
					{
						name: 'Top Organic Score',
						value: 'toporganicscore',
					},
					{
						name: 'Top Traded',
						value: 'toptraded',
					},
					{
						name: 'Top Trending',
						value: 'toptrending',
					},
				],
				default: 'toporganicscore',
				description: 'Category to get tokens from',
				displayOptions: {
					show: {
						operation: ['category'],
					},
				},
			},
			{
				displayName: 'Time Interval',
				name: 'interval',
				type: 'options',
				options: [
					{
						name: '5 Minutes',
						value: '5m',
					},
					{
						name: '1 Hour',
						value: '1h',
					},
					{
						name: '6 Hours',
						value: '6h',
					},
					{
						name: '24 Hours',
						value: '24h',
					},
				],
				default: '24h',
				description: 'Time interval for category data',
				displayOptions: {
					show: {
						operation: ['category'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const baseUrl = this.getNodeParameter('baseUrl', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				let url = '';
				const queryParams: Record<string, string | number> = {};

				switch (operation) {
					case 'search':
						const query = this.getNodeParameter('query', itemIndex) as string;
						const limit = this.getNodeParameter('limit', itemIndex) as number;
						
						url = `${baseUrl}/search`;
						if (query) queryParams.query = query;
						if (limit) queryParams.limit = limit;
						break;

					case 'tag':
						const tag = this.getNodeParameter('tag', itemIndex) as string;
						url = `${baseUrl}/tag/${tag}`;
						break;

					case 'category':
						const category = this.getNodeParameter('category', itemIndex) as string;
						const interval = this.getNodeParameter('interval', itemIndex) as string;
						url = `${baseUrl}/${category}/${interval}`;
						break;

					case 'recent':
						url = `${baseUrl}/recent`;
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex,
						});
				}

				const options: IHttpRequestOptions = {
					method: 'GET',
					url,
					qs: queryParams,
					json: true,
				};

				try {
					const credentials = await this.getCredentials('jupiterApi');
					if (credentials && credentials.apiKey) {
						options.headers = {
							'x-api-key': credentials.apiKey as string,
						};
					}
				} catch (error) {
					// No credentials provided, continue without API key
				}

				const response = await this.helpers.httpRequest(options);

				returnData.push({
					json: response,
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: itemIndex,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}