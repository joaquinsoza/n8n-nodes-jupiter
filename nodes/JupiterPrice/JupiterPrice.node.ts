import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class JupiterPrice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter Price',
		name: 'jupiterPrice',
		icon: 'file:jupiterLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Jupiter Price API v3 operations',
		defaults: {
			name: 'Jupiter Price',
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
				default: 'https://lite-api.jup.ag/price/v3',
				description: 'Base URL for Jupiter Price API v3',
			},
			{
				displayName: 'Token IDs',
				name: 'ids',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
				description: 'Comma-separated list of token mint addresses to get prices for',
			},
			{
				displayName: 'VS Token',
				name: 'vsToken',
				type: 'string',
				typeOptions: { password: true },
				default: 'USDC',
				placeholder: 'USDC',
				description: 'Token to price against (default: USDC)',
			},
			{
				displayName: 'VS Token Address',
				name: 'vsTokenAddress',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
				description: 'Token address to price against (optional)',
			},
			{
				displayName: 'Show Extra Info',
				name: 'showExtraInfo',
				type: 'boolean',
				default: false,
				description: 'Whether to show additional token information',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const baseUrl = this.getNodeParameter('baseUrl', itemIndex) as string;
				const ids = this.getNodeParameter('ids', itemIndex) as string;
				const vsToken = this.getNodeParameter('vsToken', itemIndex) as string;
				const vsTokenAddress = this.getNodeParameter('vsTokenAddress', itemIndex) as string;
				const showExtraInfo = this.getNodeParameter('showExtraInfo', itemIndex) as boolean;

				const queryParams: Record<string, string | boolean> = {};
				if (ids) queryParams.ids = ids;
				if (vsToken) queryParams.vsToken = vsToken;
				if (vsTokenAddress) queryParams.vsTokenAddress = vsTokenAddress;
				if (showExtraInfo) queryParams.showExtraInfo = showExtraInfo;

				const options: IHttpRequestOptions = {
					method: 'GET',
					url: `${baseUrl}/price`,
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