import Foundation
import Security

final class FullAuthenticationPolicy {
    typealias Receipt = FullAuthenticationReceipt
    var days = 30
    private var memory: Receipt?
    private var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: (Bundle.main.bundleIdentifier ?? "") + ".full-authentication",
         kSecAttrAccount as String: "receipt"]
    }
    func record(subject: String) {
        let now = Date().timeIntervalSince1970
        memory = Receipt(subject: subject, authenticatedAt: now, lastSeen: now)
        persist()
    }
    func valid(subject: String) -> Bool {
        if memory == nil {
            var read = query
            read[kSecReturnData as String] = true
            read[kSecMatchLimit as String] = kSecMatchLimitOne
            var result: CFTypeRef?
            if SecItemCopyMatching(read as CFDictionary, &result) == errSecSuccess, let data = result as? Data {
                memory = try? JSONDecoder().decode(Receipt.self, from: data)
            }
        }
        let now = Date().timeIntervalSince1970
        guard memory?.valid(subject: subject, now: now, days: days) == true else { return false }
        memory?.lastSeen = now
        persist()
        return true
    }
    private func persist() {
        guard let memory, let data = try? JSONEncoder().encode(memory) else { return }
        let values = [kSecValueData as String: data] as [String: Any]
        if SecItemUpdate(query as CFDictionary, values as CFDictionary) == errSecItemNotFound {
            var item = query.merging(values) { _, new in new }
            item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
            SecItemAdd(item as CFDictionary, nil)
        }
    }
    func clear() { memory = nil; SecItemDelete(query as CFDictionary) }
}
