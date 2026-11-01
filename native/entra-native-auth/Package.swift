// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EntraNativeAuthPlugin",
    platforms: [.iOS(.v17)],
    products: [.library(name: "EntraNativeAuthPlugin", targets: ["EntraNativeAuthPlugin"])],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.6.0"),
        .package(url: "https://github.com/AzureAD/microsoft-authentication-library-for-objc.git", exact: "2.17.0")
    ],
    targets: [.target(name: "EntraNativeAuthPlugin", dependencies: [
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "MSAL", package: "microsoft-authentication-library-for-objc")
    ], path: "ios/Sources/EntraNativeAuthPlugin")]
)
