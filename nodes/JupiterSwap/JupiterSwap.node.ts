import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class JupiterSwap implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter Swap',
		name: 'jupiterSwap',
		icon: 'file:jupiterLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Jupiter Swap API operations',
		defaults: {
			name: 'Jupiter Swap',
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
				default: 'https://lite-api.jup.ag/swap/v1',
				description: 'Base URL for Jupiter Swap API',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Program ID to Label',
						value: 'programIdToLabel',
						description: 'Get program ID to label mapping',
						action: 'Get program ID mapping',
					},
					{
						name: 'Quote',
						value: 'quote',
						description: 'Get a quote for a potential swap',
						action: 'Get swap quote',
					},
					{
						name: 'Swap',
						value: 'swap',
						description: 'Generate swap transaction',
						action: 'Generate swap transaction',
					},
					{
						name: 'Swap Instructions',
						value: 'swapInstructions',
						description: 'Get swap instructions for custom transaction building',
						action: 'Get swap instructions',
					},
				],
				default: 'quote',
			},
			// Quote parameters
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
						operation: ['quote', 'swap', 'swapInstructions'],
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
						operation: ['quote', 'swap', 'swapInstructions'],
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
						operation: ['quote', 'swap', 'swapInstructions'],
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
						operation: ['quote', 'swap', 'swapInstructions'],
					},
				},
			},
			// Swap specific parameters
			{
				displayName: 'User Public Key',
				name: 'userPublicKey',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'User public key for the swap',
				displayOptions: {
					show: {
						operation: ['swap', 'swapInstructions'],
					},
				},
			},
			{
				displayName: 'Wrap and Unwrap SOL',
				name: 'wrapAndUnwrapSol',
				type: 'boolean',
				default: true,
				description: 'Whether to wrap and unwrap SOL',
				displayOptions: {
					show: {
						operation: ['swap', 'swapInstructions'],
					},
				},
			},
			{
				displayName: 'Use Shared Accounts',
				name: 'useSharedAccounts',
				type: 'boolean',
				default: true,
				description: 'Whether to use shared accounts',
				displayOptions: {
					show: {
						operation: ['swap', 'swapInstructions'],
					},
				},
			},
			{
				displayName: 'Fee Account',
				name: 'feeAccount',
				type: 'string',
				default: '',
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Fee account address (optional)',
				displayOptions: {
					show: {
						operation: ['swap', 'swapInstructions'],
					},
				},
			},
			{
				displayName: 'Compute Unit Price Micro Lamports',
				name: 'computeUnitPriceMicroLamports',
				type: 'number',
				default: 0,
				description: 'Compute unit price in micro lamports (optional)',
				displayOptions: {
					show: {
						operation: ['swap', 'swapInstructions'],
					},
				},
			},
			// Quote specific parameters
			{
				displayName: 'Swap Mode',
				name: 'swapMode',
				type: 'options',
				options: [
					{
						name: 'Exact In',
						value: 'ExactIn',
					},
					{
						name: 'Exact Out',
						value: 'ExactOut',
					},
				],
				default: 'ExactIn',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'DEXes',
				name: 'dexes',
				type: 'string',
				default: '',
				placeholder: 'Raydium,Orca,Phoenix',
				description: 'Comma-separated list of DEXes to use (optional)',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'Exclude DEXes',
				name: 'excludeDexes',
				type: 'string',
				default: '',
				placeholder: 'Raydium,Orca',
				description: 'Comma-separated list of DEXes to exclude (optional)',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'Restrict Intermediate Tokens',
				name: 'restrictIntermediateTokens',
				type: 'boolean',
				default: false,
				description: 'Whether to restrict intermediate tokens',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'Only Direct Routes',
				name: 'onlyDirectRoutes',
				type: 'boolean',
				default: false,
				description: 'Whether to only use direct routes',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'As Legacy Transaction',
				name: 'asLegacyTransaction',
				type: 'boolean',
				default: false,
				description: 'Whether to return as legacy transaction',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'Platform Fee BPS',
				name: 'platformFeeBps',
				type: 'number',
				default: 0,
				description: 'Platform fee in basis points (optional)',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
			},
			{
				displayName: 'Max Accounts',
				name: 'maxAccounts',
				type: 'number',
				default: 64,
				description: 'Maximum number of accounts',
				displayOptions: {
					show: {
						operation: ['quote'],
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
				const queryParams: Record<string, string | number | boolean> = {};
				let body: Record<string, any> = {};

				switch (operation) {
					case 'quote':
						const quoteInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const quoteOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const quoteAmount = this.getNodeParameter('amount', itemIndex) as string;
						const quoteSlippageBps = this.getNodeParameter('slippageBps', itemIndex) as number;
						const swapMode = this.getNodeParameter('swapMode', itemIndex) as string;
						const dexes = this.getNodeParameter('dexes', itemIndex) as string;
						const excludeDexes = this.getNodeParameter('excludeDexes', itemIndex) as string;
						const restrictIntermediateTokens = this.getNodeParameter('restrictIntermediateTokens', itemIndex) as boolean;
						const onlyDirectRoutes = this.getNodeParameter('onlyDirectRoutes', itemIndex) as boolean;
						const asLegacyTransaction = this.getNodeParameter('asLegacyTransaction', itemIndex) as boolean;
						const platformFeeBps = this.getNodeParameter('platformFeeBps', itemIndex) as number;
						const maxAccounts = this.getNodeParameter('maxAccounts', itemIndex) as number;

						url = `${baseUrl}/quote`;
						queryParams.inputMint = quoteInputMint;
						queryParams.outputMint = quoteOutputMint;
						queryParams.amount = quoteAmount;
						queryParams.slippageBps = quoteSlippageBps;
						queryParams.swapMode = swapMode;
						if (dexes) queryParams.dexes = dexes;
						if (excludeDexes) queryParams.excludeDexes = excludeDexes;
						if (restrictIntermediateTokens) queryParams.restrictIntermediateTokens = restrictIntermediateTokens;
						if (onlyDirectRoutes) queryParams.onlyDirectRoutes = onlyDirectRoutes;
						if (asLegacyTransaction) queryParams.asLegacyTransaction = asLegacyTransaction;
						if (platformFeeBps) queryParams.platformFeeBps = platformFeeBps;
						if (maxAccounts) queryParams.maxAccounts = maxAccounts;
						break;

					case 'swap':
						const swapInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const swapOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const swapAmount = this.getNodeParameter('amount', itemIndex) as string;
						const swapSlippageBps = this.getNodeParameter('slippageBps', itemIndex) as number;
						const userPublicKey = this.getNodeParameter('userPublicKey', itemIndex) as string;
						const wrapAndUnwrapSol = this.getNodeParameter('wrapAndUnwrapSol', itemIndex) as boolean;
						const useSharedAccounts = this.getNodeParameter('useSharedAccounts', itemIndex) as boolean;
						const feeAccount = this.getNodeParameter('feeAccount', itemIndex) as string;
						const computeUnitPriceMicroLamports = this.getNodeParameter('computeUnitPriceMicroLamports', itemIndex) as number;

						url = `${baseUrl}/swap`;
						method = 'POST';
						body = {
							inputMint: swapInputMint,
							outputMint: swapOutputMint,
							amount: swapAmount,
							slippageBps: swapSlippageBps,
							userPublicKey,
							wrapAndUnwrapSol,
							useSharedAccounts,
						};
						if (feeAccount) body.feeAccount = feeAccount;
						if (computeUnitPriceMicroLamports) body.computeUnitPriceMicroLamports = computeUnitPriceMicroLamports;
						break;

					case 'swapInstructions':
						const instructionsInputMint = this.getNodeParameter('inputMint', itemIndex) as string;
						const instructionsOutputMint = this.getNodeParameter('outputMint', itemIndex) as string;
						const instructionsAmount = this.getNodeParameter('amount', itemIndex) as string;
						const instructionsSlippageBps = this.getNodeParameter('slippageBps', itemIndex) as number;
						const instructionsUserPublicKey = this.getNodeParameter('userPublicKey', itemIndex) as string;
						const instructionsWrapAndUnwrapSol = this.getNodeParameter('wrapAndUnwrapSol', itemIndex) as boolean;
						const instructionsUseSharedAccounts = this.getNodeParameter('useSharedAccounts', itemIndex) as boolean;
						const instructionsFeeAccount = this.getNodeParameter('feeAccount', itemIndex) as string;
						const instructionsComputeUnitPriceMicroLamports = this.getNodeParameter('computeUnitPriceMicroLamports', itemIndex) as number;

						url = `${baseUrl}/swap-instructions`;
						method = 'POST';
						body = {
							inputMint: instructionsInputMint,
							outputMint: instructionsOutputMint,
							amount: instructionsAmount,
							slippageBps: instructionsSlippageBps,
							userPublicKey: instructionsUserPublicKey,
							wrapAndUnwrapSol: instructionsWrapAndUnwrapSol,
							useSharedAccounts: instructionsUseSharedAccounts,
						};
						if (instructionsFeeAccount) body.feeAccount = instructionsFeeAccount;
						if (instructionsComputeUnitPriceMicroLamports) body.computeUnitPriceMicroLamports = instructionsComputeUnitPriceMicroLamports;
						break;

					case 'programIdToLabel':
						url = `${baseUrl}/program-id-to-label`;
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