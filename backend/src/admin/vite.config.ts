import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
    // Important: always return the modified config
    return mergeConfig(config, {
        resolve: {
            alias: {
                '@': '/src',
            },
        },
        server: {
            allowedHosts: ['lianginvestments.com', 'www.lianginvestments.com', '156.238.229.104', 'localhost'],
        },
    });
};
