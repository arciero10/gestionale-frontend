import {
    provideKeycloak,
    createInterceptorCondition,
    IncludeBearerTokenCondition,
    INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
    withAutoRefreshToken,
    AutoRefreshTokenService,
    UserActivityService
} from 'keycloak-angular';
import { KeycloakOnLoad } from 'keycloak-js';
import { environment } from 'src/environments/environment';

const localhostCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: /^(http:\/\/localhost:6010)(\/.*)?$/i
});

export const provideKeycloakAngular = () =>
    provideKeycloak({
        config: {
            url: environment.keycloak.config.url,
            realm: environment.keycloak.config.realm,
            clientId: environment.keycloak.config.clientId,
            
        },
        initOptions: {
            onLoad: environment.keycloak.initOptions.onLoad as KeycloakOnLoad,
            silentCheckSsoRedirectUri: environment.keycloak.initOptions.silentCheckSsoRedirectUri,
            redirectUri: environment.keycloak.initOptions.redirectUri
       },
        features: [
            withAutoRefreshToken({
                onInactivityTimeout: 'logout',
                sessionTimeout: 1000
            })
        ],
        providers: [
            AutoRefreshTokenService,
            UserActivityService,
            {
                provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
                useValue: [localhostCondition]
            }
        ]
    });
