import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class JupiterRecurring implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter Recurring',
		name: 'jupiterRecurring',
		icon: 'file:jupiterLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Jupiter Recurring API operations',
		defaults: {
			name: 'Jupiter Recurring',
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
				default: 'https://lite-api.jup.ag/recurring/v1',
				description: 'Base URL for Jupiter Recurring API',
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
						description: 'Cancel a recurring order',
						action: 'Cancel recurring order',
					},
					{
						name: 'Create Order',
						value: 'createOrder',
						description: 'Create a new recurring order',
						action: 'Create recurring order',
					},
					{
						name: 'Execute',
						value: 'execute',
						description: 'Execute a signed transaction',
						action: 'Execute transaction',
					},
					{
						name: 'Get Recurring Orders',
						value: 'getRecurringOrders',
						description: 'Get active or historical recurring orders',
						action: 'Get recurring orders',
					},
					{
						name: 'Price Deposit',
						value: 'priceDeposit',
						description: 'Create deposit transaction for price-based order',
						action: 'Create price deposit',
					},
					{
						name: 'Price Withdraw',
						value: 'priceWithdraw',
						description: 'Create withdrawal transaction for price-based order',
						action: 'Create price withdraw',
					},
				],
				default: 'createOrder',
			},
			// Common parameters
			{
				displayName: 'Recurring Type',
				name: 'recurringType',
				type: 'options',
				options: [
					{
						name: 'Time',
						value: 'time',
					},
					{
						name: 'Price',
						value: 'price',
					},
				],
				default: 'time',
				description: 'Type of recurring order',
				displayOptions: {
					show: {
						operation: ['createOrder', 'cancelOrder', 'execute'],
					},
				},
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
						operation: ['getRecurringOrders'],
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
						operation: ['getRecurringOrders'],
					},
				},
			},
			// Create/Cancel Order parameters
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
						operation: ['createOrder', 'cancelOrder', 'priceDeposit', 'priceWithdraw'],
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
						operation: ['createOrder', 'cancelOrder', 'priceDeposit', 'priceWithdraw'],
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
						operation: ['createOrder', 'priceDeposit', 'priceWithdraw'],
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
						operation: ['createOrder', 'cancelOrder', 'priceDeposit', 'priceWithdraw'],
					},
				},
			},
			// Additional optional parameters
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				default: '',
				description: 'Order ID (optional for cancel operations)',
				displayOptions: {
					show: {
						operation: ['cancelOrder'],
					},
				},
			},
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
						const createInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const createOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const createAmount = this.getNodeParameter('amount', itemIndex) as string;
						const createMaker = this.getNodeParameter('maker', itemIndex) as string;
						const createRecurringType = this.getNodeParameter('recurringType', itemIndex) as string;
						const slippageBps = this.getNodeParameter('slippageBps', itemIndex) as number;

						url = `${baseUrl}/createOrder`;
						method = 'POST';
						body = {
							inputMint: createInputMint,
							outputMint: createOutputMint,
							amount: createAmount,
							maker: createMaker,
							recurringType: createRecurringType,
							slippageBps,
						};
						break;

					case 'cancelOrder':
						const cancelInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const cancelOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const cancelMaker = this.getNodeParameter('maker', itemIndex) as string;
						const cancelRecurringType = this.getNodeParameter('recurringType', itemIndex) as string;
						const orderId = this.getNodeParameter('orderId', itemIndex) as string;

						url = `${baseUrl}/cancelOrder`;
						method = 'POST';
						body = {
							inputMint: cancelInputMint,
							outputMint: cancelOutputMint,
							maker: cancelMaker,
							recurringType: cancelRecurringType,
						};
						if (orderId) body.orderId = orderId;
						break;

					case 'execute':
						const signedTransaction = this.getNodeParameter('signedTransaction', itemIndex) as string;
						const requestId = this.getNodeParameter('requestId', itemIndex) as string;
						const recurringType = this.getNodeParameter('recurringType', itemIndex) as string;

						url = `${baseUrl}/execute`;
						method = 'POST';
						body = {
							signedTransaction,
							requestId,
							recurringType,
						};
						break;

					case 'getRecurringOrders':
						const account = this.getNodeParameter('account', itemIndex) as string;
						const orderType = this.getNodeParameter('orderType', itemIndex) as string;

						url = `${baseUrl}/getRecurringOrders`;
						queryParams.account = account;
						queryParams.orderType = orderType;
						break;

					case 'priceDeposit':
						const depositInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const depositOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const depositAmount = this.getNodeParameter('amount', itemIndex) as string;
						const depositMaker = this.getNodeParameter('maker', itemIndex) as string;

						url = `${baseUrl}/priceDeposit`;
						method = 'POST';
						body = {
							inputMint: depositInputMint,
							outputMint: depositOutputMint,
							amount: depositAmount,
							maker: depositMaker,
						};
						break;

					case 'priceWithdraw':
						const withdrawInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const withdrawOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const withdrawAmount = this.getNodeParameter('amount', itemIndex) as string;
						const withdrawMaker = this.getNodeParameter('maker', itemIndex) as string;

						url = `${baseUrl}/priceWithdraw`;
						method = 'POST';
						body = {
							inputMint: withdrawInputMint,
							outputMint: withdrawOutputMint,
							amount: withdrawAmount,
							maker: withdrawMaker,
						};
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