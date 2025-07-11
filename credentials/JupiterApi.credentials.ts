import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JupiterApi implements ICredentialType {
	name = 'jupiterApi';
	displayName = 'Jupiter API';
	documentationUrl = 'https://docs.jup.ag/apis/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Jupiter API Key (optional). Leave empty to use the free lite-api.jup.ag endpoints (rate-limited).',
		},
	];
}