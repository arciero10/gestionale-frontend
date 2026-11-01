import Capacitor
import MSAL

// The SDK owns all continuation tokens. This object retains only its typed states.
final class NativeFlow: NSObject, SignInStartDelegate, SignInVerifyCodeDelegate,
    SignInPasswordRequiredDelegate, SignInResendCodeDelegate, SignUpStartDelegate,
    SignUpVerifyCodeDelegate, SignUpResendCodeDelegate, SignUpPasswordRequiredDelegate,
    SignUpAttributesRequiredDelegate, SignInAfterSignUpDelegate, ResetPasswordStartDelegate,
    ResetPasswordVerifyCodeDelegate, ResetPasswordResendCodeDelegate,
    ResetPasswordRequiredDelegate, CredentialsDelegate {
    weak var owner: EntraNativeAuthPlugin?
    var state: AnyObject?
    let scopes: [String]
    var tokenGeneration: Int?
    var authenticationGeneration: Int?

    init(owner: EntraNativeAuthPlugin, scopes: [String]) {
        self.owner = owner
        self.scopes = scopes
    }

    private func step(_ name: String, _ state: AnyObject) {
        self.state = state
        owner?.finish(["step": name])
    }
    private func code(_ state: AnyObject, _ length: Int) {
        self.state = state
        owner?.finish(["step": "code", "codeLength": length])
    }
    private func error(_ error: MSALNativeAuthError, _ state: AnyObject? = nil) {
        self.state = state
        owner?.failed(error)
    }

    func onSignInStartError(error: SignInStartError) { self.error(error) }
    func onSignInVerifyCodeError(error: VerifyCodeError, newState: SignInCodeRequiredState?) { self.error(error, newState) }
    func onSignInPasswordRequiredError(error: PasswordRequiredError, newState: SignInPasswordRequiredState?) { self.error(error, newState) }
    func onSignInResendCodeError(error: ResendCodeError, newState: SignInCodeRequiredState?) { self.error(error, newState) }
    func onSignUpStartError(error: SignUpStartError) { self.error(error) }
    func onSignUpVerifyCodeError(error: VerifyCodeError, newState: SignUpCodeRequiredState?) { self.error(error, newState) }
    func onSignUpResendCodeError(error: ResendCodeError, newState: SignUpCodeRequiredState?) { self.error(error, newState) }
    func onSignUpPasswordRequiredError(error: PasswordRequiredError, newState: SignUpPasswordRequiredState?) { self.error(error, newState) }
    func onSignUpAttributesRequiredError(error: AttributesRequiredError) { self.error(error, state) }
    func onSignInAfterSignUpError(error: SignInAfterSignUpError) { self.error(error) }
    func onResetPasswordStartError(error: ResetPasswordStartError) { self.error(error) }
    func onResetPasswordVerifyCodeError(error: VerifyCodeError, newState: ResetPasswordCodeRequiredState?) { self.error(error, newState) }
    func onResetPasswordResendCodeError(error: ResendCodeError, newState: ResetPasswordCodeRequiredState?) { self.error(error, newState) }
    func onResetPasswordRequiredError(error: PasswordRequiredError, newState: ResetPasswordRequiredState?) { self.error(error, newState) }
    func onAccessTokenRetrieveError(error: RetrieveAccessTokenError) { self.error(error) }

    func onSignInCodeRequired(newState: SignInCodeRequiredState, sentTo: String, channelTargetType: MSALNativeAuthChannelType, codeLength: Int) { code(newState, codeLength) }
    func onSignInResendCodeCodeRequired(newState: SignInCodeRequiredState, sentTo: String, channelTargetType: MSALNativeAuthChannelType, codeLength: Int) { code(newState, codeLength) }
    func onSignUpCodeRequired(newState: SignUpCodeRequiredState, sentTo: String, channelTargetType: MSALNativeAuthChannelType, codeLength: Int) { code(newState, codeLength) }
    func onSignUpResendCodeCodeRequired(newState: SignUpCodeRequiredState, sentTo: String, channelTargetType: MSALNativeAuthChannelType, codeLength: Int) { code(newState, codeLength) }
    func onResetPasswordCodeRequired(newState: ResetPasswordCodeRequiredState, sentTo: String, channelTargetType: MSALNativeAuthChannelType, codeLength: Int) { code(newState, codeLength) }
    func onResetPasswordResendCodeRequired(newState: ResetPasswordCodeRequiredState, sentTo: String, channelTargetType: MSALNativeAuthChannelType, codeLength: Int) { code(newState, codeLength) }
    func onSignInPasswordRequired(newState: SignInPasswordRequiredState) { step("password", newState) }
    func onSignUpPasswordRequired(newState: SignUpPasswordRequiredState) { step("password", newState) }
    func onPasswordRequired(newState: ResetPasswordRequiredState) { step("password", newState) }

    func onSignUpAttributesRequired(attributes: [MSALNativeAuthRequiredAttribute], newState: SignUpAttributesRequiredState) {
        state = newState
        let fields: [JSObject] = attributes.map { ["name": $0.name, "label": $0.name, "required": $0.required] }
        owner?.finish(["step": "attributes", "attributes": fields])
    }
    func onSignUpAttributesInvalid(attributeNames: [String]) {
        state = nil
        owner?.finish(["step": "login", "error": "INVALID_ATTRIBUTES"])
    }
    func onSignUpAttributesInvalid(attributeNames: [String], newState: SignUpAttributesRequiredState) {
        state = newState
        let fields: [JSObject] = attributeNames.map { ["name": $0, "label": $0, "required": true] }
        owner?.finish(["step": "attributes", "attributes": fields, "error": "INVALID_ATTRIBUTES"])
    }
    func onSignUpCompleted(newState: SignInAfterSignUpState) {
        state = nil
        let parameters = MSALNativeAuthSignInAfterSignUpParameters()
        parameters.scopes = scopes
        newState.signIn(parameters: parameters, delegate: self)
    }
    func onResetPasswordCompleted(newState: SignInAfterResetPasswordState) {
        state = nil
        owner?.finish(["step": "complete"])
    }
    func onSignInCompleted(result: MSALNativeAuthUserAccountResult) {
        owner?.authenticated(result, epoch: authenticationGeneration)
    }
    func onAccessTokenRetrieveCompleted(result: MSALNativeAuthTokenResult) {
        owner?.token(result.accessToken, epoch: tokenGeneration)
    }
    func onSignInAwaitingMFA(authMethods: [MSALAuthMethod], newState: AwaitingMFAState) {
        state = nil
        owner?.finish(["step": "fallback"])
    }
    func onSignInStrongAuthMethodRegistration(authMethods: [MSALAuthMethod], newState: RegisterStrongAuthState) {
        state = nil
        owner?.finish(["step": "fallback"])
    }
}
