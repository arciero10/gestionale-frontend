export type MapsProvider = 'google' | 'azure' | 'none';

export const maps = {
    provider: 'none' as MapsProvider,
    googleMapsEmbedApiKey: '',
    azureMapsKey: ''
};
