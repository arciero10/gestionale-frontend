import Foundation

struct NativeAuthDiagnostic {
    let phase: String
    let code: String
    let serverCodes: [Int]

    init(phase: String, serverCodes: [Int] = [], browserRequired: Bool = false,
         invalidCode: Bool = false, signInRejected: Bool = false,
         accountConflict: Bool = false, transportFailure: Bool = false,
         configurationFailure: Bool = false, methodUnavailable: Bool = false) {
        let phases = ["configuration", "start", "challenge", "resend", "token", "unlock", "logout", "restore"]
        self.phase = phases.contains(phase) ? phase : "start"
        self.serverCodes = Array(Set(serverCodes.filter { $0 > 0 && $0 < 10_000_000 })).sorted().prefix(3).map { $0 }
        if accountConflict { code = "ACCOUNT_ALREADY_SIGNED_IN" }
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

    var data: [String: Any] { ["platform": "ios", "phase": phase, "code": code, "serverCodes": serverCodes] }
}
