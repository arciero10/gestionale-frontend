/* export const environment = {
    apiBaseUrl: 'http://localhost:5000/api'
};
 */

export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:6010/api',
    keycloak: {
        config: {
            url: 'http://localhost:18080',      // Indirizzo del container Keycloak
            realm: 'keycloak-auth-demo',              // Il tuo Realm in Keycloak
            clientId: 'gestionale-frontend-client' // Client ID configurato in Keycloak
        },
        initOptions: {
            onLoad: 'login-required',//'check-sso',
            checkLoginIframe: false,
            silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
            redirectUri: window.location.origin + '/',
            postLogoutRedirectUri: 'http://localhost:4200'
        },
        bearerExcludedUrls: ['/assets', '/i18n', 'keycloak'] // Esempio
    }
};