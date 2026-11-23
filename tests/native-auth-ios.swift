import Foundation
import XCTest
@testable import NativeAuthDiagnostics

final class NativeAuthDiagnosticTests: XCTestCase {
    func testConfiguration() {
        XCTAssertEqual(NativeAuthDiagnostic(phase: "start", serverCodes: [700016]).code, "AUTH_CONFIGURATION")
    }
    func testStartIsNotAssumedToBeNetworkOrBadCode() {
        XCTAssertEqual(NativeAuthDiagnostic(phase: "start").code, "AUTH_START_FAILED")
        XCTAssertEqual(NativeAuthDiagnostic(phase: "start", transportFailure: true).code, "AUTH_TRANSPORT")
    }
    func testOtpAndTokenAreSeparate() {
        XCTAssertEqual(NativeAuthDiagnostic(phase: "challenge", invalidCode: true).code, "AUTH_CHALLENGE_REJECTED")
        XCTAssertEqual(NativeAuthDiagnostic(phase: "token").code, "AUTH_TOKEN_FAILED")
    }
    func testBrowserAndMethodAreExplicit() {
        XCTAssertEqual(NativeAuthDiagnostic(phase: "start", browserRequired: true).code, "AUTH_BROWSER_REQUIRED")
        XCTAssertEqual(NativeAuthDiagnostic(phase: "start", methodUnavailable: true).code, "AUTH_METHOD_UNAVAILABLE")
    }
    func testExistingAccountRecoveryIsPreserved() {
        XCTAssertEqual(NativeAuthDiagnostic(phase: "start", accountConflict: true).code, "ACCOUNT_ALREADY_SIGNED_IN")
    }
    func testOnlyAllowlistedMetadataCrossesBridge() {
        let d = NativeAuthDiagnostic(phase: "private-data", serverCodes: [-1, 700016, 700016, 99_999_999])
        XCTAssertEqual(d.phase, "start")
        XCTAssertEqual(d.serverCodes, [700016])
        XCTAssertEqual(Set(d.data.keys), Set(["platform", "phase", "code", "serverCodes"]))
    }
}
