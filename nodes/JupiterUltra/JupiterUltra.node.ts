import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class JupiterUltra implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter Ultra',
		name: 'jupiterUltra',
		icon: 'file:jupiterLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Jupiter Ultra API operations',
		defaults: {
			name: 'Jupiter Ultra',
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
				default: 'https://lite-api.jup.ag/ultra/v1',
				description: 'Base URL for Jupiter Ultra API',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Balances',
						value: 'balances',
						description: 'Get token balances for account',
						action: 'Get balances',
					},
					{
						name: 'Execute',
						value: 'execute',
						description: 'Submit signed transaction',
						action: 'Execute swap',
					},
					{
						name: 'Order',
						value: 'order',
						description: 'Get quote and unsigned swap transaction',
						action: 'Create swap order',
					},
					{
						name: 'Routers',
						value: 'routers',
						description: 'Get available liquidity routers',
						action: 'Get routers',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Fuzzy search tokens',
						action: 'Search tokens',
					},
					{
						name: 'Shield',
						value: 'shield',
						description: 'Get token risk warnings',
						action: 'Get shield info',
					},
				],
				default: 'balances',
			},
			{
				displayName: 'Input Mint',
				name: 'inputMint',
				type: 'string',
				default: '',
				placeholder: 'So11111111111111111111111111111111111111112',
				description: 'Input token mint address',
				displayOptions: {
					show: {
						operation: ['order'],
					},
				},
			},
			{
				displayName: 'Output Mint',
				name: 'outputMint',
				type: 'string',
				default: '',
				placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
				description: 'Output token mint address',
				displayOptions: {
					show: {
						operation: ['order'],
					},
				},
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				placeholder: '1000000',
				description: 'Amount in smallest unit (lamports/atoms)',
				displayOptions: {
					show: {
						operation: ['order'],
					},
				},
			},
			{
				displayName: 'Taker',
				name: 'taker',
				type: 'string',
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Taker wallet address (optional)',
				displayOptions: {
					show: {
						operation: ['order'],
					},
				},
			},
			{
				displayName: 'Referral Account',
				name: 'referralAccount',
				type: 'string',
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Referral account address (optional)',
				displayOptions: {
					show: {
						operation: ['order'],
					},
				},
			},
			{
				displayName: 'Referral Fee',
				name: 'referralFee',
				type: 'number',
				default: 0,
				description: 'Referral fee in basis points (0-10000)',
				displayOptions: {
					show: {
						operation: ['order'],
					},
					hide: {
						referralAccount: [''],
					},
				},
			},
			{
				displayName: 'Exclude Routers',
				name: 'excludeRouters',
				type: 'string',
				default: '',
				placeholder: 'router1,router2',
				description: 'Comma-separated list of routers to exclude',
				displayOptions: {
					show: {
						operation: ['order'],
					},
				},
			},
			{
				displayName: 'Signed Transaction',
				name: 'signedTransaction',
				type: 'string',
				default: '',
				description: 'Base64 encoded signed transaction',
				displayOptions: {
					show: {
						operation: ['execute'],
					},
				},
			},
			{
				displayName: 'Request ID',
				name: 'requestId',
				type: 'string',
				default: '',
				description: 'Request ID from the order endpoint',
				displayOptions: {
					show: {
						operation: ['execute'],
					},
				},
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Wallet address to get balances for',
				displayOptions: {
					show: {
						operation: ['balances'],
					},
				},
			},
			{
				displayName: 'Mints',
				name: 'mints',
				type: 'string',
				default: '',
				placeholder: 'mint1,mint2,mint3',
				description: 'Comma-separated list of mint addresses',
				displayOptions: {
					show: {
						operation: ['shield'],
					},
				},
			},
			{
				displayName: 'Search Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'USDC',
				description: 'Search query for tokens',
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
				let method: 'GET' | 'POST' = 'GET';
				const queryParams: Record<string, string | number> = {};
				let body: Record<string, any> = {};

				switch (operation) {
					case 'order':
						const inputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const outputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const amount = this.getNodeParameter('amount', itemIndex) as string;
						const taker = this.getNodeParameter('taker', itemIndex) as string;
						const referralAccount = this.getNodeParameter('referralAccount', itemIndex) as string;
						const referralFee = this.getNodeParameter('referralFee', itemIndex) as number;
						const excludeRouters = this.getNodeParameter('excludeRouters', itemIndex) as string;

						url = `${baseUrl}/order`;
						queryParams.inputMint = inputMint;
						queryParams.outputMint = outputMint;
						queryParams.amount = amount;
						if (taker) queryParams.taker = taker;
						if (referralAccount) queryParams.referralAccount = referralAccount;
						if (referralFee) queryParams.referralFee = referralFee;
						if (excludeRouters) queryParams.excludeRouters = excludeRouters;
						break;

					case 'execute':
						const signedTransaction = this.getNodeParameter('signedTransaction', itemIndex) as string;
						const requestId = this.getNodeParameter('requestId', itemIndex) as string;

						url = `${baseUrl}/execute`;
						method = 'POST';
						body = {
							signedTransaction,
							requestId,
						};
						break;

					case 'balances':
						const address = this.getNodeParameter('address', itemIndex) as string;
						url = `${baseUrl}/balances/${address}`;
						break;

					case 'shield':
						const mints = this.getNodeParameter('mints', itemIndex) as string;
						url = `${baseUrl}/shield`;
						queryParams.mints = mints;
						break;

					case 'routers':
						url = `${baseUrl}/order/routers`;
						break;

					case 'search':
						const query = this.getNodeParameter('query', itemIndex) as string;
						url = `${baseUrl}/search`;
						queryParams.query = query;
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex,
						});
				}

				const options: IHttpRequestOptions = {
					method,
					url,
					qs: queryParams,
					json: true,
				};

				if (method === 'POST' && Object.keys(body).length > 0) {
					options.body = body;
				}

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