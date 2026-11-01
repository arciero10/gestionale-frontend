import Capacitor
import LocalAuthentication
import MSAL
import UIKit

@objc(EntraNativeAuthPlugin)
public final class EntraNativeAuthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EntraNativeAuthPlugin"
    public let jsName = "EntraNativeAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        "configure", "start", "submit", "resend", "getAccessToken", "restore", "unlock", "lock", "logout", "cancel"
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }

    private var application: MSALNativeAuthPublicClientApplication?
    private var makeApplication: ((MSALNativeAuthChallengeTypes) throws -> MSALNativeAuthPublicClientApplication)?
    private var scopes: [String] = []
    private var flow: NativeFlow?
    private var pending: CAPPluginCall?
    private var busy = false
    private var cancelled = false
    private var context: LAContext?
    private var backgroundObserver: NSObjectProtocol?
    private var generation = 0
    private var unlocked = false

    public override func load() {
        MSALGlobalConfig.loggerConfig.logLevel = .nothing
        backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main
        ) { [weak self] _ in
            self?.context?.invalidate()
            self?.context = nil
            self?.unlocked = false
            self?.generation += 1
        }
    }

    deinit {
        if let observer = backgroundObserver { NotificationCenter.default.removeObserver(observer) }
        context?.invalidate()
    }

    private func main(_ action: @escaping () -> Void) { DispatchQueue.main.async(execute: action) }
    private func reject(_ call: CAPPluginCall, _ code: String) {
        call.reject("Native authentication could not complete.", code)
    }

    @objc public func configure(_ call: CAPPluginCall) { main { [self] in
        guard !busy else { reject(call, "BUSY"); return }
        guard let client = call.getString("clientId"), UUID(uuidString: client) != nil,
              let tenant = call.getString("tenantSubdomain"),
              tenant.range(of: "^[A-Za-z0-9][A-Za-z0-9-]{0,62}$", options: .regularExpression) != nil,
              let requested = call.getArray("scopes", String.self), !requested.isEmpty,
              requested.allSatisfy({ !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty })
        else { reject(call, "INVALID_CONFIGURATION"); return }
        if let authority = call.getString("authority") {
            guard let url = URLComponents(string: authority), url.scheme == "https",
                  url.host == "\(tenant).ciamlogin.com", url.user == nil, url.password == nil,
                  url.port == nil, url.query == nil, url.fragment == nil,
                  UUID(uuidString: url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))) != nil
            else { reject(call, "INVALID_CONFIGURATION"); return }
        }
        do {
            guard let bundle = Bundle.main.bundleIdentifier else { reject(call, "INVALID_CONFIGURATION"); return }
            let factory: (MSALNativeAuthChallengeTypes) throws -> MSALNativeAuthPublicClientApplication = { challenges in
                let config = try MSALNativeAuthPublicClientApplicationConfig(
                    clientId: client, tenantSubdomain: tenant, challengeTypes: challenges)
                // MSAL documents the bundle ID as the app-private Keychain group setting.
                config.cacheConfig.keychainSharingGroup = bundle
                return try MSALNativeAuthPublicClientApplication(nativeAuthConfiguration: config)
            }
            application = try factory([.OOB, .password])
            makeApplication = factory
            scopes = requested
            flow = nil
            unlocked = false
            generation += 1
            call.resolve(["step": "login"])
        } catch { reject(call, "INVALID_CONFIGURATION") }
    } }

    private func begin(_ call: CAPPluginCall) -> Bool {
        guard application != nil else { reject(call, "NOT_CONFIGURED"); return false }
        guard !busy else { reject(call, "BUSY"); return false }
        busy = true
        cancelled = false
        pending = call
        return true
    }

    func finish(_ result: JSObject) {
        if !cancelled { pending?.resolve(result) }
        pending = nil
        busy = false
        if cancelled { flow = nil }
    }

    func failed(_ error: MSALNativeAuthError) {
        if error.isBrowserRequired { flow?.state = nil; finish(["step": "fallback"]); return }
        if !cancelled, let call = pending { reject(call, "AUTH_FAILED") }
        pending = nil
        busy = false
        if cancelled { flow = nil }
    }

    func authenticated(_ result: MSALNativeAuthUserAccountResult, epoch: Int?) {
        flow?.state = nil
        guard !cancelled else { result.signOut(); finish(["step": "login"]); return }
        guard epoch == generation, UIApplication.shared.applicationState == .active else {
            unlocked = false
            finish(["step": "unlock"])
            return
        }
        unlocked = true
        finish(["step": "authenticated"])
    }

    @objc public func start(_ call: CAPPluginCall) { main { [self] in
        guard let kind = call.getString("flow"), ["signin", "signup", "reset"].contains(kind),
              let email = call.getString("email"), !email.isEmpty,
              let method = call.getString("method"), ["password", "otp"].contains(method)
        else { reject(call, "INVALID_INPUT"); return }
        guard begin(call) else { return }
        do {
            // OTP must not advertise password support: the SDK negotiates the challenge.
            application = try makeApplication?(method == "otp" ? [.OOB] : [.OOB, .password])
        } catch {
            reject(call, "INVALID_CONFIGURATION")
            pending = nil; busy = false
            return
        }
        guard let application else {
            reject(call, "NOT_CONFIGURED")
            pending = nil; busy = false
            return
        }
        let delegate = NativeFlow(owner: self, scopes: scopes)
        delegate.authenticationGeneration = generation
        flow = delegate
        if kind == "signin" {
            let parameters = MSALNativeAuthSignInParameters(username: email)
            parameters.scopes = scopes
            parameters.password = method == "password" ? call.getString("password") : nil
            application.signIn(parameters: parameters, delegate: delegate)
        } else if kind == "signup" {
            let parameters = MSALNativeAuthSignUpParameters(username: email)
            parameters.password = method == "password" ? call.getString("password") : nil
            application.signUp(parameters: parameters, delegate: delegate)
        } else {
            application.resetPassword(parameters: MSALNativeAuthResetPasswordParameters(username: email), delegate: delegate)
        }
    } }

    @objc public func submit(_ call: CAPPluginCall) { main { [self] in
        guard !busy else { reject(call, "BUSY"); return }
        guard let flow, let state = flow.state else { reject(call, "NO_FLOW"); return }
        let code = call.getString("code") ?? ""
        let password = call.getString("password") ?? ""
        let attributes = call.getObject("attributes")
        switch state {
        case is SignInCodeRequiredState, is SignUpCodeRequiredState, is ResetPasswordCodeRequiredState:
            guard !code.isEmpty else { reject(call, "INVALID_INPUT"); return }
        case is SignInPasswordRequiredState, is SignUpPasswordRequiredState, is ResetPasswordRequiredState:
            guard !password.isEmpty else { reject(call, "INVALID_INPUT"); return }
        case is SignUpAttributesRequiredState:
            guard let attributes, !attributes.isEmpty,
                  attributes.values.allSatisfy({ $0 is String || $0 is NSNumber })
            else { reject(call, "INVALID_INPUT"); return }
        default: reject(call, "NO_FLOW"); return
        }
        guard begin(call) else { return }
        switch state {
        case let s as SignInCodeRequiredState: s.submitCode(code: code, delegate: flow)
        case let s as SignUpCodeRequiredState: s.submitCode(code: code, delegate: flow)
        case let s as ResetPasswordCodeRequiredState: s.submitCode(code: code, delegate: flow)
        case let s as SignInPasswordRequiredState: s.submitPassword(password: password, delegate: flow)
        case let s as SignUpPasswordRequiredState: s.submitPassword(password: password, delegate: flow)
        case let s as ResetPasswordRequiredState: s.submitPassword(password: password, delegate: flow)
        case let s as SignUpAttributesRequiredState: s.submitAttributes(attributes: attributes!, delegate: flow)
        default: finish(["step": "login"])
        }
    } }

    @objc public func resend(_ call: CAPPluginCall) { main { [self] in
        guard !busy else { reject(call, "BUSY"); return }
        guard let flow, let state = flow.state,
              state is SignInCodeRequiredState || state is SignUpCodeRequiredState || state is ResetPasswordCodeRequiredState
        else { reject(call, "NO_FLOW"); return }
        guard begin(call) else { return }
        if let s = state as? SignInCodeRequiredState { s.resendCode(delegate: flow) }
        if let s = state as? SignUpCodeRequiredState { s.resendCode(delegate: flow) }
        if let s = state as? ResetPasswordCodeRequiredState { s.resendCode(delegate: flow) }
    } }

    // LocalAuthentication is the only way to unlock a restored SDK session.
    private func gated(_ call: CAPPluginCall, action: @escaping () -> Void) {
        guard begin(call) else { return }
        let local = LAContext()
        context = local
        let epoch = generation
        var error: NSError?
        guard UIApplication.shared.applicationState == .active,
              local.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
        else { pending = nil; busy = false; reject(call, "LOCAL_AUTH_UNAVAILABLE"); return }
        local.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock your account") { [weak self] success, _ in
            DispatchQueue.main.async {
                guard let self else { return }
                guard success, !self.cancelled, epoch == self.generation,
                      UIApplication.shared.applicationState == .active else {
                    if !self.cancelled { self.reject(call, "LOCAL_AUTH_FAILED") }
                    self.pending = nil; self.busy = false; self.context = nil
                    return
                }
                self.context = nil
                action()
            }
        }
    }

    @objc public func restore(_ call: CAPPluginCall) { main { [self] in
        guard application != nil else { reject(call, "NOT_CONFIGURED"); return }
        guard !busy else { reject(call, "BUSY"); return }
        unlocked = false
        call.resolve(["step": application?.getNativeAuthUserAccount() == nil ? "login" : "unlock"])
    } }
    @objc public func unlock(_ call: CAPPluginCall) { main { [self] in
        gated(call) { [self] in
            unlocked = application?.getNativeAuthUserAccount() != nil
            finish(["step": unlocked ? "authenticated" : "login"])
        }
    } }
    @objc public func lock(_ call: CAPPluginCall) { main { [self] in
        unlocked = false
        generation += 1
        context?.invalidate()
        context = nil
        call.resolve(["step": "unlock"])
    } }
    @objc public func getAccessToken(_ call: CAPPluginCall) { main { [self] in
        guard unlocked, UIApplication.shared.applicationState == .active else { reject(call, "LOCKED"); return }
        guard begin(call) else { return }
        let epoch = generation
        do {
            guard let account = application?.getNativeAuthUserAccount() else { finish(["step": "login"]); return }
            let delegate = NativeFlow(owner: self, scopes: scopes)
            delegate.tokenGeneration = epoch
            flow = delegate
            let parameters = MSALNativeAuthGetAccessTokenParameters()
            parameters.scopes = scopes
            parameters.returnRefreshToken = false
            account.getAccessToken(parameters: parameters, delegate: delegate)
        }
    } }

    func token(_ value: String, epoch: Int?) {
        if cancelled { application?.getNativeAuthUserAccount()?.signOut() }
        guard unlocked, epoch == generation, UIApplication.shared.applicationState == .active else {
            if !cancelled, let pending { reject(pending, "LOCKED") }
            pending = nil
            finish([:])
            return
        }
        finish(["accessToken": value])
    }

    private func stop() {
        generation += 1
        cancelled = true
        unlocked = false
        context?.invalidate()
        context = nil
        pending?.reject("Native authentication cancelled.", "CANCELLED")
        pending = nil
        // Keep an in-flight delegate alive until its callback drains. A late login is signed out.
        if !busy { flow = nil }
    }
    @objc public func cancel(_ call: CAPPluginCall) { main { [self] in stop(); call.resolve(["step": "login"]) } }
    @objc public func logout(_ call: CAPPluginCall) { main { [self] in
        stop()
        application?.getNativeAuthUserAccount()?.signOut()
        if application?.getNativeAuthUserAccount() != nil { reject(call, "CACHE_CLEAR_FAILED"); return }
        call.resolve(["step": "login"])
    } }
}

// Retains the native plugin in builds made before Capacitor regenerates packageClassList.
@objc(EntraNativeAuthBridgeViewController)
public final class EntraNativeAuthBridgeViewController: CAPBridgeViewController {
    public override func capacitorDidLoad() {
        super.capacitorDidLoad()
        if bridge?.plugin(withName: "EntraNativeAuth") == nil {
            bridge?.registerPluginInstance(EntraNativeAuthPlugin())
        }
    }
}
