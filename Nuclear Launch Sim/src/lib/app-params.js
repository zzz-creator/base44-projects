const isNode = typeof window === 'undefined';

const getAppParams = () => {
	return {
		appId: 'nuclear-launch-simulator',
		token: null,
		fromUrl: isNode ? '' : window.location.href,
		functionsVersion: '1.0.0',
		appBaseUrl: isNode ? '' : window.location.origin,
	}
}

export const appParams = {
	...getAppParams()
}
