package it.panteleia.entranativeauth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.nio.ByteBuffer
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

internal class FullAuthenticationPolicy(private val context: Context) {
    var days = 30
    private val preferences = context.getSharedPreferences("full-authentication", Context.MODE_PRIVATE)
    private val alias = context.packageName + ".full-authentication"
    private var memory: Triple<String, Long, Long>? = null
    companion object {
        fun valid(authenticatedAt: Long, lastSeen: Long, now: Long, days: Int): Boolean =
            authenticatedAt > 0 && authenticatedAt <= lastSeen && now >= lastSeen && now - authenticatedAt < days.toLong() * 86400000
    }
    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(alias, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
    }
    fun record(subject: String) {
        val now = System.currentTimeMillis()
        memory = Triple(subject, now, now)
        persist(subject)
    }
    fun valid(subject: String): Boolean {
        if (subject.isEmpty()) return false
        if (memory == null) try {
            val encoded = preferences.getString("receipt", null) ?: return false
            require(encoded.length <= 256)
            val bytes = Base64.decode(encoded, Base64.NO_WRAP)
            require(bytes.size >= 40)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
            cipher.updateAAD(subject.toByteArray(Charsets.UTF_8))
            val data = ByteBuffer.wrap(cipher.doFinal(bytes.copyOfRange(12, bytes.size)))
            memory = Triple(subject, data.long, data.long)
        } catch (_: Exception) { return false }
        val value = memory ?: return false
        val now = System.currentTimeMillis()
        if (value.first != subject || !valid(value.second, value.third, now, days)) return false
        memory = Triple(subject, value.second, now)
        persist(subject)
        return true
    }
    private fun persist(subject: String) { try {
        val value = memory ?: return
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        cipher.updateAAD(subject.toByteArray(Charsets.UTF_8))
        val bytes = ByteBuffer.allocate(16).putLong(value.second).putLong(value.third).array()
        preferences.edit().putString("receipt", Base64.encodeToString(cipher.iv + cipher.doFinal(bytes), Base64.NO_WRAP)).commit()
    } catch (_: Exception) { /* Missing protected storage disables restore after process death. */ } }
    fun clear() { memory = null; preferences.edit().remove("receipt").commit() }
}
