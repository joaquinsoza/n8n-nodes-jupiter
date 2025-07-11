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
		description: 'Jupiter Token API operations',
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
				default: 'https://lite-api.jup.ag/tokens/v1',
				description: 'Base URL for Jupiter Token API',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get All Tokens',
						value: 'getAllTokens',
						description: 'Get full token list with metadata',
						action: 'Get all tokens',
					},
					{
						name: 'Get Mints in Market',
						value: 'getMintsInMarket',
						description: 'Get mints in a pool/market',
						action: 'Get mints in market',
					},
					{
						name: 'Get New Tokens',
						value: 'getNewTokens',
						description: 'Get paginated list of newest tokens',
						action: 'Get new tokens',
					},
					{
						name: 'Get Tagged Tokens',
						value: 'getTaggedTokens',
						description: 'Get tokens by tag list',
						action: 'Get tagged tokens',
					},
					{
						name: 'Get Token',
						value: 'getToken',
						description: 'Get metadata for a single token',
						action: 'Get token metadata',
					},
					{
						name: 'Get Tradable Mints',
						value: 'getTradableMints',
						description: 'Get list of all tradable mints',
						action: 'Get tradable mints',
					},
				],
				default: 'getAllTokens',
			},
			{
				displayName: 'Mint Address',
				name: 'mintAddress',
				type: 'string',
				default: '',
				placeholder: 'So11111111111111111111111111111111111111112',
				description: 'Token mint address',
				displayOptions: {
					show: {
						operation: ['getToken'],
					},
				},
			},
			{
				displayName: 'Market Address',
				name: 'marketAddress',
				type: 'string',
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Market/pool address',
				displayOptions: {
					show: {
						operation: ['getMintsInMarket'],
					},
				},
			},
			{
				displayName: 'Tag List',
				name: 'tagList',
				type: 'string',
				default: '',
				placeholder: 'verified,community',
				description: 'Comma-separated list of tags',
				displayOptions: {
					show: {
						operation: ['getTaggedTokens'],
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
						operation: ['getNewTokens'],
					},
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Pagination offset',
				displayOptions: {
					show: {
						operation: ['getNewTokens'],
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
					case 'getToken':
						const mintAddress = this.getNodeParameter('mintAddress', itemIndex) as string;
						url = `${baseUrl}/token/${mintAddress}`;
						break;

					case 'getNewTokens':
						const limit = this.getNodeParameter('limit', itemIndex) as number;
						const offset = this.getNodeParameter('offset', itemIndex) as number;
						url = `${baseUrl}/new`;
						if (limit) queryParams.limit = limit;
						if (offset) queryParams.offset = offset;
						break;

					case 'getAllTokens':
						url = `${baseUrl}/all`;
						break;

					case 'getTaggedTokens':
						const tagList = this.getNodeParameter('tagList', itemIndex) as string;
						url = `${baseUrl}/tagged/${tagList}`;
						break;

					case 'getMintsInMarket':
						const marketAddress = this.getNodeParameter('marketAddress', itemIndex) as string;
						url = `${baseUrl}/market/${marketAddress}/mints`;
						break;

					case 'getTradableMints':
						url = `${baseUrl}/mints/tradable`;
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