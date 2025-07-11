import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class JupiterTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter Trigger',
		name: 'jupiterTrigger',
		icon: 'file:jupiterLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Jupiter Trigger API operations',
		defaults: {
			name: 'Jupiter Trigger',
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
				default: 'https://lite-api.jup.ag/trigger/v1',
				description: 'Base URL for Jupiter Trigger API',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Cancel Order',
						value: 'cancelOrder',
						description: 'Cancel a trigger order',
						action: 'Cancel trigger order',
					},
					{
						name: 'Cancel Orders',
						value: 'cancelOrders',
						description: 'Cancel multiple trigger orders',
						action: 'Cancel trigger orders',
					},
					{
						name: 'Create Order',
						value: 'createOrder',
						description: 'Create a new trigger order',
						action: 'Create trigger order',
					},
					{
						name: 'Execute',
						value: 'execute',
						description: 'Execute a signed transaction',
						action: 'Execute transaction',
					},
					{
						name: 'Get Trigger Orders',
						value: 'getTriggerOrders',
						description: 'Get active or historical trigger orders',
						action: 'Get trigger orders',
					},
				],
				default: 'createOrder',
			},
			// Execute parameters
			{
				displayName: 'Signed Transaction',
				name: 'signedTransaction',
				type: 'string',
				required: true,
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
				required: true,
				default: '',
				description: 'Request ID from createOrder or cancelOrder response',
				displayOptions: {
					show: {
						operation: ['execute'],
					},
				},
			},
			// Get orders parameters
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Account address to get orders for',
				displayOptions: {
					show: {
						operation: ['getTriggerOrders'],
					},
				},
			},
			{
				displayName: 'Order Type',
				name: 'orderType',
				type: 'options',
				options: [
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Historical',
						value: 'historical',
					},
				],
				default: 'active',
				description: 'Type of orders to retrieve',
				displayOptions: {
					show: {
						operation: ['getTriggerOrders'],
					},
				},
			},
			// Create Order parameters
			{
				displayName: 'Input Mint',
				name: 'inputMint',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'So11111111111111111111111111111111111111112',
				description: 'Input token mint address',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
			},
			{
				displayName: 'Output Mint',
				name: 'outputMint',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
				description: 'Output token mint address',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				required: true,
				default: '',
				placeholder: '1000000',
				description: 'Amount in smallest unit (lamports/atoms)',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
			},
			{
				displayName: 'Maker',
				name: 'maker',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Maker wallet address',
				displayOptions: {
					show: {
						operation: ['createOrder', 'cancelOrder', 'cancelOrders'],
					},
				},
			},
			{
				displayName: 'Trigger Price',
				name: 'triggerPrice',
				type: 'string',
				required: true,
				default: '',
				placeholder: '1.5',
				description: 'Price at which to trigger the order',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
			},
			{
				displayName: 'Trigger Condition',
				name: 'triggerCondition',
				type: 'options',
				options: [
					{
						name: 'Above',
						value: 'above',
					},
					{
						name: 'Below',
						value: 'below',
					},
				],
				default: 'above',
				description: 'Condition for triggering the order',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
			},
			// Cancel Order parameters
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				default: '',
				description: 'Specific order ID to cancel (optional)',
				displayOptions: {
					show: {
						operation: ['cancelOrder'],
					},
				},
			},
			{
				displayName: 'Order IDs',
				name: 'orderIds',
				type: 'string',
				default: '',
				placeholder: 'order1,order2,order3',
				description: 'Comma-separated list of order IDs to cancel (optional)',
				displayOptions: {
					show: {
						operation: ['cancelOrders'],
					},
				},
			},
			// Additional optional parameters
			{
				displayName: 'Slippage BPS',
				name: 'slippageBps',
				type: 'number',
				default: 50,
				description: 'Slippage in basis points (default: 50)',
				displayOptions: {
					show: {
						operation: ['createOrder'],
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
					case 'createOrder':
						const inputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const outputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const amount = this.getNodeParameter('amount', itemIndex) as string;
						const maker = this.getNodeParameter('maker', itemIndex) as string;
						const triggerPrice = this.getNodeParameter('triggerPrice', itemIndex) as string;
						const triggerCondition = this.getNodeParameter('triggerCondition', itemIndex) as string;
						const slippageBps = this.getNodeParameter('slippageBps', itemIndex) as number;

						url = `${baseUrl}/createOrder`;
						method = 'POST';
						body = {
							inputMint,
							outputMint,
							amount,
							maker,
							triggerPrice,
							triggerCondition,
							slippageBps,
						};
						break;

					case 'cancelOrder':
						const cancelMaker = this.getNodeParameter('maker', itemIndex) as string;
						const orderId = this.getNodeParameter('orderId', itemIndex) as string;

						url = `${baseUrl}/cancelOrder`;
						method = 'POST';
						body = {
							maker: cancelMaker,
						};
						if (orderId) body.orderId = orderId;
						break;

					case 'cancelOrders':
						const cancelOrdersMaker = this.getNodeParameter('maker', itemIndex) as string;
						const orderIds = this.getNodeParameter('orderIds', itemIndex) as string;

						url = `${baseUrl}/cancelOrders`;
						method = 'POST';
						body = {
							maker: cancelOrdersMaker,
						};
						if (orderIds) body.orderIds = orderIds.split(',').map(id => id.trim());
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

					case 'getTriggerOrders':
						const account = this.getNodeParameter('account', itemIndex) as string;
						const orderType = this.getNodeParameter('orderType', itemIndex) as string;

						url = `${baseUrl}/getTriggerOrders`;
						queryParams.account = account;
						queryParams.orderType = orderType;
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