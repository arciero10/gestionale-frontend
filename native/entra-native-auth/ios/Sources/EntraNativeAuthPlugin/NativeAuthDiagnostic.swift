import Foundation

struct FullAuthenticationReceipt: Codable {
    let subject: String
    let authenticatedAt: TimeInterval
    var lastSeen: TimeInterval
    func valid(subject: String, now: TimeInterval, days: Int) -> Bool {
        self.subject == subject && !subject.isEmpty && now >= lastSeen &&
            authenticatedAt > 0 && authenticatedAt <= lastSeen && now - authenticatedAt < Double(days) * 86400
    }
}

enum NativeProfileTransport {
    static func category(_ error: NSError?) -> String {
        guard let error, error.domain == NSURLErrorDomain else { return "NETWORK" }
        switch error.code {
        case -1001: return "TIMEOUT"
        case -1206 ... -1200, -1022: return "TLS"
        case -1009, -1003, -1004, -1005, -1006: return "CONNECTIVITY"
        default: return "NETWORK"
        }
    }
}

enum NativeUnlockDecision: Equatable {
    case allow, awaitActivation, deny
    static func evaluate(verified: Bool, cancelled: Bool, sameSession: Bool, active: Bool) -> Self {
        guard verified, !cancelled, sameSession else { return .deny }
        return active ? .allow : .awaitActivation
    }
}

enum NativeAuthChallengeEpoch {
    static func submission(current: Int, active: Bool) -> Int? { active ? current : nil }
}

enum NativeAuthLocalFailure: String, CaseIterable {
    case unavailable = "AUTH_LOCAL_UNAVAILABLE"
    case cancelled = "AUTH_LOCAL_CANCELLED"
    case rejected = "AUTH_LOCAL_REJECTED"
    case lockout = "AUTH_LOCAL_LOCKOUT"
    case contextInvalid = "AUTH_LOCAL_CONTEXT_INVALID"
    case inactive = "AUTH_APP_INACTIVE"
    case sessionChanged = "AUTH_SESSION_CHANGED"
    case cacheMissing = "AUTH_CACHE_ACCOUNT_MISSING"
    case locked = "AUTH_SESSION_LOCKED"
    case keychain = "AUTH_KEYCHAIN_FAILED"
    case interactionRequired = "AUTH_TOKEN_INTERACTION_REQUIRED"
}

struct NativeAuthDiagnostic {
    let phase: String
    let code: String
    let serverCodes: [Int]
    let sdkCode: Int?

    init(phase: String, serverCodes: [Int] = [], browserRequired: Bool = false,
         invalidCode: Bool = false, signInRejected: Bool = false,
         accountConflict: Bool = false, transportFailure: Bool = false,
         configurationFailure: Bool = false, methodUnavailable: Bool = false,
         localFailure: NativeAuthLocalFailure? = nil, tokenExpired: Bool = false, sdkCode: Int? = nil) {
        let phases = ["configuration", "start", "challenge", "resend", "token", "unlock", "logout", "restore"]
        self.phase = phases.contains(phase) ? phase : "start"
        self.sdkCode = sdkCode
        self.serverCodes = Array(Set(serverCodes.filter { $0 > 0 && $0 < 10_000_000 })).sorted().prefix(3).map { $0 }
        if let localFailure { code = localFailure.rawValue }
        else if tokenExpired { code = "AUTH_TOKEN_EXPIRED" }
        else if accountConflict { code = "ACCOUNT_ALREADY_SIGNED_IN" }
        else if configurationFailure || self.serverCodes.contains(where: { [700016, 7000218, 90002, 65001].contains($0) }) { code = "AUTH_CONFIGURATION" }
        else if transportFailure { code = "AUTH_TRANSPORT" }
        else if methodUnavailable { code = "AUTH_METHOD_UNAVAILABLE" }
        else if browserRequired { code = "AUTH_BROWSER_REQUIRED" }
        else if invalidCode { code = "AUTH_CHALLENGE_REJECTED" }
        else if signInRejected { code = "AUTH_SIGNIN_REJECTED" }
        else if self.phase == "token" { code = "AUTH_TOKEN_FAILED" }
        else if ["challenge", "resend"].contains(self.phase) { code = "AUTH_CHALLENGE_FAILED" }
        else { code = "AUTH_START_FAILED" }
    }

    var data: [String: Any] {
        var result: [String: Any] = ["platform": "ios", "phase": phase, "code": code, "serverCodes": serverCodes]
        if let sdkCode { result["sdkCode"] = sdkCode }
        return result
    }
}
