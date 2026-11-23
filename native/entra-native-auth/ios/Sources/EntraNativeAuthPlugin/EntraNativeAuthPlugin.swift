import Capacitor
import LocalAuthentication
import MSAL
import OSLog
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
    private var activationObserver: NSObjectProtocol?
    private var activationTimeout: DispatchWorkItem?
    private var generation = 0
    private var unlocked = false
    private var phase = "configuration"
    private var phaseStarted = Date()
    private let diagnostics = Logger(subsystem: "it.panteleia.eventidicomunita", category: "NativeAuth")

    private func startPhase(_ value: String) {
        phase = value
        phaseStarted = Date()
        diagnostics.info("phase=\(value, privacy: .public) event=started")
    }

    private func report(_ diagnostic: NativeAuthDiagnostic) {
        let elapsed = Int(Date().timeIntervalSince(phaseStarted) * 1000)
        let codes = diagnostic.serverCodes.map(String.init).joined(separator: ",")
        diagnostics.info("phase=\(diagnostic.phase, privacy: .public) code=\(diagnostic.code, privacy: .public) serverCodes=\(codes, privacy: .public) elapsedMs=\(elapsed)")
    }

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
        if let observer = activationObserver { NotificationCenter.default.removeObserver(observer) }
        activationTimeout?.cancel()
        context?.invalidate()
    }

    private func main(_ action: @escaping () -> Void) { DispatchQueue.main.async(execute: action) }
    private func reject(_ call: CAPPluginCall, _ code: String) {
        if ["INVALID_CONFIGURATION", "NOT_CONFIGURED"].contains(code) {
            let diagnostic = NativeAuthDiagnostic(phase: phase, configurationFailure: true)
            report(diagnostic)
            call.reject("Native authentication could not complete.", diagnostic.code, nil, diagnostic.data)
            return
        }
        call.reject("Native authentication could not complete.", code)
    }

    @objc public func configure(_ call: CAPPluginCall) { main { [self] in
        startPhase("configuration")
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
        } catch {
            let nsError = error as NSError
            let diagnostic = NativeAuthDiagnostic(phase: phase,
                transportFailure: nsError.domain == NSURLErrorDomain,
                configurationFailure: nsError.domain != NSURLErrorDomain)
            report(diagnostic)
            call.reject("Native authentication could not complete.", diagnostic.code, nil, diagnostic.data)
        }
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
        let step = result["step"] as? String ?? "missing"
        if ["login", "code", "password", "attributes", "authenticated", "complete", "fallback", "unlock"].contains(step) {
            diagnostics.info("phase=\(self.phase, privacy: .public) outcome=\(step, privacy: .public)")
        }
        if !cancelled { pending?.resolve(result) }
        pending = nil
        busy = false
        if cancelled { flow = nil }
    }

    func failed(_ error: MSALNativeAuthError) {
        let startError = error as? SignInStartError
        let diagnostic = NativeAuthDiagnostic(phase: phase, serverCodes: error.errorCodes,
            browserRequired: error.isBrowserRequired,
            invalidCode: (error as? VerifyCodeError)?.isInvalidCode == true,
            signInRejected: startError?.isInvalidCredentials == true || startError?.isInvalidUsername == true || startError?.isUserNotFound == true,
            accountConflict: error.localizedDescription.lowercased().contains("already signed in"),
            configurationFailure: (error as? RetrieveAccessTokenError)?.isInvalidScope == true,
            tokenExpired: (error as? RetrieveAccessTokenError)?.isRefreshTokenExpired == true)
        report(diagnostic)
        if error.isBrowserRequired { flow?.state = nil; finish(["step": "fallback", "diagnostic": diagnostic.bridgeData]); return }
        if !cancelled, let call = pending {
            call.reject("Native authentication could not complete.", diagnostic.code, nil, diagnostic.data)
        }
        pending = nil
        busy = false
        if cancelled { flow = nil }
    }

    func requireDifferentMethod() {
        let diagnostic = NativeAuthDiagnostic(phase: phase, methodUnavailable: true)
        report(diagnostic)
        finish(["step": "fallback", "diagnostic": diagnostic.bridgeData])
    }

    func authenticated(_ result: MSALNativeAuthUserAccountResult, epoch: Int?) {
        flow?.state = nil
        guard !cancelled else { result.signOut(); finish(["step": "login"]); return }
        guard epoch == generation, UIApplication.shared.applicationState == .active else {
            unlocked = false
            finish(["step": "unlock"])
            return
        }
        guard application?.getNativeAuthUserAccount() != nil else {
            if let pending { rejectLocal(pending, .cacheMissing) }
            self.pending = nil; busy = false; return
        }
        diagnostics.info("phase=challenge event=account_cache_verified")
        unlocked = true
        finish(["step": "authenticated"])
    }

    @objc public func start(_ call: CAPPluginCall) { main { [self] in
        guard let kind = call.getString("flow"), ["signin", "signup", "reset"].contains(kind),
              let email = call.getString("email"), !email.isEmpty,
              let method = call.getString("method"), ["password", "otp"].contains(method)
        else { reject(call, "INVALID_INPUT"); return }
        guard begin(call) else { return }
        startPhase("start")
        do {
            // OTP must not advertise password support: the SDK negotiates the challenge.
            application?.getNativeAuthUserAccount()?.signOut()
            guard application?.getNativeAuthUserAccount() == nil else {
                reject(call, "CACHE_CLEAR_FAILED")
                pending = nil; busy = false
                return
            }
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
        let delegate = NativeFlow(owner: self, scopes: scopes, otpOnly: method == "otp")
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
        guard let submissionEpoch = NativeAuthChallengeEpoch.submission(current: generation,
            active: UIApplication.shared.applicationState == .active) else {
            startPhase("challenge"); rejectLocal(call, .inactive); return
        }
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
        startPhase("challenge")
        // Reading the OTP in Mail can background the app between start and submit.
        // Bind this foreground operation to the current lock epoch, not the old start epoch.
        flow.authenticationGeneration = submissionEpoch
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
        startPhase("resend")
        if let s = state as? SignInCodeRequiredState { s.resendCode(delegate: flow) }
        if let s = state as? SignUpCodeRequiredState { s.resendCode(delegate: flow) }
        if let s = state as? ResetPasswordCodeRequiredState { s.resendCode(delegate: flow) }
    } }

    // LocalAuthentication is the only way to unlock a restored SDK session.
    private func clearActivationWait() {
        if let observer = activationObserver { NotificationCenter.default.removeObserver(observer) }
        activationObserver = nil
        activationTimeout?.cancel()
        activationTimeout = nil
    }

    private func completeLocalUnlock(_ call: CAPPluginCall, epoch: Int, action: @escaping () -> Void) {
        clearActivationWait()
        let decision = NativeUnlockDecision.evaluate(verified: true, cancelled: cancelled,
            sameSession: epoch == generation, active: UIApplication.shared.applicationState == .active)
        switch decision {
        case .deny:
            if !cancelled { rejectLocal(call, .sessionChanged) }
            pending = nil; busy = false
        case .allow:
            diagnostics.info("phase=unlock event=local_auth_verified")
            action()
        case .awaitActivation:
            // Face ID may reply before UIKit reactivates the app. Never authorize while inactive.
            diagnostics.info("phase=unlock event=awaiting_activation")
            activationObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main
            ) { [weak self] _ in self?.completeLocalUnlock(call, epoch: epoch, action: action) }
            let timeout = DispatchWorkItem { [weak self] in
                guard let self else { return }
                self.clearActivationWait()
                if !self.cancelled { self.rejectLocal(call, .inactive) }
                self.pending = nil; self.busy = false
            }
            activationTimeout = timeout
            DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: timeout)
        }
    }

    private func rejectLocal(_ call: CAPPluginCall, _ failure: NativeAuthLocalFailure) {
        let diagnostic = NativeAuthDiagnostic(phase: phase, localFailure: failure)
        report(diagnostic)
        call.reject("Native authentication could not complete.", diagnostic.code, nil, diagnostic.data)
    }

    private func localFailure(_ error: Error?) -> NativeAuthLocalFailure {
        guard let error = error as? LAError else { return .rejected }
        switch error.code {
        case .userCancel, .systemCancel, .appCancel, .userFallback: return .cancelled
        case .biometryLockout: return .lockout
        case .invalidContext: return .contextInvalid
        case .biometryNotAvailable, .biometryNotEnrolled, .passcodeNotSet: return .unavailable
        default: return .rejected
        }
    }

    private func gated(_ call: CAPPluginCall, action: @escaping () -> Void) {
        guard begin(call) else { return }
        let local = LAContext()
        context = local
        let epoch = generation
        var error: NSError?
        guard UIApplication.shared.applicationState == .active else {
            pending = nil; busy = false; context = nil; rejectLocal(call, .inactive); return
        }
        guard local.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            pending = nil; busy = false; context = nil; rejectLocal(call, localFailure(error)); return
        }
        local.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock your account") { [weak self] success, evaluationError in
            DispatchQueue.main.async {
                guard let self else { return }
                guard success, !self.cancelled, epoch == self.generation else {
                    if !self.cancelled {
                        let failure: NativeAuthLocalFailure = !success ? self.localFailure(evaluationError)
                            : epoch != self.generation ? .sessionChanged : .inactive
                        self.rejectLocal(call, failure)
                    }
                    self.pending = nil; self.busy = false; self.context = nil
                    return
                }
                self.context = nil
                self.completeLocalUnlock(call, epoch: epoch, action: action)
            }
        }
    }

    @objc public func restore(_ call: CAPPluginCall) { main { [self] in
        startPhase("restore")
        guard application != nil else { reject(call, "NOT_CONFIGURED"); return }
        guard !busy else { reject(call, "BUSY"); return }
        unlocked = false
        diagnostics.info("phase=restore accountPresent=\(application?.getNativeAuthUserAccount() != nil)")
        call.resolve(["step": application?.getNativeAuthUserAccount() == nil ? "login" : "unlock"])
    } }
    @objc public func unlock(_ call: CAPPluginCall) { main { [self] in
        startPhase("unlock")
        gated(call) { [self] in
            unlocked = application?.getNativeAuthUserAccount() != nil
            guard unlocked else {
                rejectLocal(call, .cacheMissing); pending = nil; busy = false; return
            }
            finish(["step": unlocked ? "authenticated" : "login"])
        }
    } }
    @objc public func lock(_ call: CAPPluginCall) { main { [self] in
        let awaitingActivation = activationObserver != nil
        clearActivationWait()
        if awaitingActivation, let pending { rejectLocal(pending, .sessionChanged); self.pending = nil; busy = false }
        unlocked = false
        generation += 1
        context?.invalidate()
        context = nil
        call.resolve(["step": "unlock"])
    } }
    @objc public func getAccessToken(_ call: CAPPluginCall) { main { [self] in
        guard unlocked, UIApplication.shared.applicationState == .active else {
            startPhase("token")
            rejectLocal(call, unlocked ? .inactive : .locked); return
        }
        guard begin(call) else { return }
        startPhase("token")
        let epoch = generation
        do {
            guard let account = application?.getNativeAuthUserAccount() else {
                rejectLocal(call, .cacheMissing); pending = nil; busy = false; return
            }
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
            if !cancelled, let pending {
                rejectLocal(pending, epoch == generation ? .inactive : .sessionChanged)
            }
            pending = nil
            finish([:])
            return
        }
        finish(["accessToken": value])
    }

    private func stop() {
        if activationObserver != nil { busy = false }
        clearActivationWait()
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
        startPhase("logout")
        stop()
        drainLogout(call, remaining: 200)
    } }
    private func drainLogout(_ call: CAPPluginCall, remaining: Int) {
        if busy {
            guard remaining > 0 else { reject(call, "CACHE_CLEAR_FAILED"); return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [self] in
                drainLogout(call, remaining: remaining - 1)
            }
            return
        }
        application?.getNativeAuthUserAccount()?.signOut()
        if application?.getNativeAuthUserAccount() != nil { reject(call, "CACHE_CLEAR_FAILED"); return }
        call.resolve(["step": "login"])
    }
}

private extension NativeAuthDiagnostic {
    var bridgeData: JSObject { ["platform": "ios", "phase": phase, "code": code, "serverCodes": serverCodes] }
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
