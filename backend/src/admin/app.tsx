import type { StrapiApp } from '@strapi/strapi/admin';

export default {
    config: {
        locales: [
            'zh-Hans',
            'zh',
        ],
    },
    bootstrap(app: StrapiApp) {
        console.log(app);
    },
};
