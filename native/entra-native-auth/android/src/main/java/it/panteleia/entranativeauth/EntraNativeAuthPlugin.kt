package it.panteleia.entranativeauth

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.microsoft.identity.client.PublicClientApplication
import com.microsoft.identity.client.Logger
import com.microsoft.identity.nativeauth.*
import com.microsoft.identity.nativeauth.parameters.*
import com.microsoft.identity.nativeauth.statemachine.results.*
import com.microsoft.identity.nativeauth.statemachine.states.*
import com.microsoft.identity.nativeauth.statemachine.errors.BrowserRequiredError
import com.microsoft.identity.nativeauth.statemachine.errors.Error as NativeError
import kotlinx.coroutines.*

@CapacitorPlugin(name = "EntraNativeAuth")
class EntraNativeAuthPlugin : Plugin() {
    private val jobs = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var client: INativeAuthPublicClientApplication? = null
    private var scopes = emptyList<String>()
    private var state: State? = null
    private var account: AccountState? = null
    private var unlocked = false
    private var busy = false
    private var foreground = true
    private var generation = 0
    private var prompt: BiometricPrompt? = null
    private var nativeClientId = ""
    private var subdomain = ""

    private fun run(call: PluginCall, operation: suspend () -> JSObject) {
        if (busy) { call.reject("Operazione in corso", "BUSY"); return }
        busy = true
        val version = generation
        jobs.launch {
            try {
                val result = operation()
                if (version == generation) call.resolve(result)
                else {
                    unlocked = false
                    account?.signOut()
                    account = null
                    state = null
                    call.reject("Operazione annullata", "CANCELLED")
                }
            } catch (_: CancellationException) {
                call.reject("Operazione annullata", "CANCELLED")
            } catch (_: Exception) {
                call.reject("Accesso non completato. Verifica i dati e la connessione.", "NATIVE_AUTH_FAILED")
            } finally { busy = false }
        }
    }

    @PluginMethod fun configure(call: PluginCall) = run(call) {
        if (client == null) {
            val clientId = requireNotNull(call.getString("clientId"))
            val subdomain = requireNotNull(call.getString("tenantSubdomain"))
            this.nativeClientId = clientId
            this.subdomain = subdomain
            require(subdomain.matches(Regex("[a-zA-Z0-9-]+")))
            scopes = call.getArray("scopes")?.toList<String>() ?: emptyList()
            require(scopes.isNotEmpty())
            Logger.getInstance().setEnablePII(false)
            Logger.getInstance().setEnableLogcatLog(false)
            // Native SDK requires the tenant domain authority, not the SPA redirect authority.
            client = PublicClientApplication.createNativeAuthPublicClientApplication(context,
                NativeAuthPublicClientApplicationParameters(clientId,
                    "https://$subdomain.ciamlogin.com/$subdomain.onmicrosoft.com/", listOf("oob", "password")))
        }
        JSObject().put("step", "login")
    }

    @PluginMethod fun start(call: PluginCall) = run(call) {
        unlocked = false
        state = null
        requireNotNull(client)
        val sdk = PublicClientApplication.createNativeAuthPublicClientApplication(context,
            NativeAuthPublicClientApplicationParameters(nativeClientId,
                "https://$subdomain.ciamlogin.com/$subdomain.onmicrosoft.com/",
                if (call.getString("method") == "otp" || call.getString("flow") == "reset") listOf("oob") else listOf("oob", "password")))
        client = sdk
        val email = requireNotNull(call.getString("email"))
        val password = call.getString("password")?.toCharArray()
        try {
            val result = when (call.getString("flow")) {
                "signup" -> sdk.signUp(NativeAuthSignUpParameters(email).apply { this.password = password })
                "reset" -> sdk.resetPassword(NativeAuthResetPasswordParameters(email))
                else -> sdk.signIn(NativeAuthSignInParameters(email).apply { this.password = password; this.scopes = this@EntraNativeAuthPlugin.scopes })
            }
            outcome(result)
        } finally { password?.fill('\u0000') }
    }

    @PluginMethod fun submit(call: PluginCall) = run(call) {
        val password = call.getString("password")?.toCharArray()
        try {
            val result = when (val current = state) {
                is SignInCodeRequiredState -> current.submitCode(requireNotNull(call.getString("code")))
                is SignUpCodeRequiredState -> current.submitCode(requireNotNull(call.getString("code")))
                is ResetPasswordCodeRequiredState -> current.submitCode(requireNotNull(call.getString("code")))
                is SignInPasswordRequiredState -> current.submitPassword(requireNotNull(password))
                is SignUpPasswordRequiredState -> current.submitPassword(requireNotNull(password))
                is ResetPasswordPasswordRequiredState -> current.submitPassword(requireNotNull(password))
                is SignUpAttributesRequiredState -> {
                    val values = requireNotNull(call.getObject("attributes"))
                    val builder = UserAttributes.Builder()
                    values.keys().forEach { key -> builder.customAttribute(key, requireNotNull(values.getString(key))) }
                    current.submitAttributes(builder.build())
                }
                else -> throw IllegalStateException()
            }
            outcome(result)
        } finally { password?.fill('\u0000') }
    }

    @PluginMethod fun resend(call: PluginCall) = run(call) {
        outcome(when (val current = state) {
            is SignInCodeRequiredState -> current.resendCode()
            is SignUpCodeRequiredState -> current.resendCode()
            is ResetPasswordCodeRequiredState -> current.resendCode()
            else -> throw IllegalStateException()
        })
    }

    private suspend fun outcome(result: Result): JSObject {
        if (result is BrowserRequiredError && result.isBrowserRequired()) return JSObject().put("step", "fallback")
        if (result is NativeError) throw IllegalArgumentException()
        if (result is SignInResult.Complete) {
            account = result.resultValue
            state = null
            unlocked = foreground
            return JSObject().put("step", if (unlocked) "authenticated" else "unlock")
        }
        if (result is Result.CompleteWithNextStateResult && result.nextState is SignInContinuationState)
            return outcome((result.nextState as SignInContinuationState).signIn(
                NativeAuthSignInContinuationParameters().apply { scopes = this@EntraNativeAuthPlugin.scopes }))
        if (result is Result.SuccessResult) {
            state = result.nextState
            val step = when (state) {
                is SignInCodeRequiredState, is SignUpCodeRequiredState, is ResetPasswordCodeRequiredState -> "code"
                is SignInPasswordRequiredState, is SignUpPasswordRequiredState, is ResetPasswordPasswordRequiredState -> "password"
                is SignUpAttributesRequiredState -> "attributes"
                else -> "fallback"
            }
            val response = JSObject().put("step", step)
            if (result is SignUpResult.AttributesRequired) {
                response.put("attributes", JSArray(result.requiredAttributes.map {
                    JSObject().put("name", it.attributeName).put("label", it.attributeName).put("required", it.required ?: true)
                }))
            }
            return response
        }
        throw IllegalStateException()
    }

    @PluginMethod fun restore(call: PluginCall) = run(call) {
        unlocked = false
        account = (requireNotNull(client).getCurrentAccount() as? GetAccountResult.AccountFound)?.resultValue
        JSObject().put("step", if (account == null) "login" else "unlock")
    }

    @PluginMethod fun unlock(call: PluginCall) {
        if (busy || account == null) { call.reject("Accedi nuovamente", "UNLOCK_REQUIRED"); return }
        busy = true
        val version = generation
        activity.runOnUiThread {
            val authenticators = (if (Build.VERSION.SDK_INT >= 30) BiometricManager.Authenticators.BIOMETRIC_STRONG
                else BiometricManager.Authenticators.BIOMETRIC_WEAK) or BiometricManager.Authenticators.DEVICE_CREDENTIAL
            if (BiometricManager.from(context).canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_SUCCESS) {
                busy = false
                call.reject("Configura il blocco dispositivo o accedi nuovamente", "UNLOCK_UNAVAILABLE")
                return@runOnUiThread
            }
            prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(context), object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    busy = false
                    if (version != generation || !foreground) { call.reject("Sblocco annullato", "CANCELLED"); return }
                    unlocked = true
                    call.resolve(JSObject().put("step", "authenticated"))
                }
                override fun onAuthenticationError(code: Int, message: CharSequence) {
                    busy = false
                    call.reject("Sblocco annullato. Puoi accedere nuovamente.", "CANCELLED")
                }
            })
            prompt!!.authenticate(BiometricPrompt.PromptInfo.Builder().setTitle("Sblocca Eventi di Comunità")
                .setSubtitle("Usa biometria o codice del dispositivo").setAllowedAuthenticators(authenticators).build())
        }
    }

    @PluginMethod fun getAccessToken(call: PluginCall) = run(call) {
        check(unlocked && foreground)
        val current = requireNotNull(account)
        val result = current.getAccessToken(NativeAuthGetAccessTokenParameters().apply { scopes = this@EntraNativeAuthPlugin.scopes })
        check(unlocked && foreground)
        if (result !is GetAccessTokenResult.Complete) throw IllegalStateException()
        JSObject().put("accessToken", result.resultValue.accessToken)
    }

    @PluginMethod fun lock(call: PluginCall) { lockSession(); call.resolve() }
    private fun lockSession() { unlocked = false }
    override fun handleOnStart() { foreground = true }
    override fun handleOnStop() { foreground = false; lockSession() }
    @PluginMethod fun cancel(call: PluginCall) {
        generation++
        state = null
        unlocked = false
        prompt?.cancelAuthentication()
        call.resolve()
    }
    @PluginMethod fun logout(call: PluginCall) {
        generation++
        state = null
        unlocked = false
        prompt?.cancelAuthentication()
        jobs.launch {
            // Drain any in-flight SDK operation before clearing its cache.
            while (busy) delay(25)
            run(call) {
                val current = account ?: (client?.getCurrentAccount() as? GetAccountResult.AccountFound)?.resultValue
                account = null
                if (current != null && current.signOut() !is SignOutResult.Complete) throw IllegalStateException()
                JSObject().put("step", "login")
            }
        }
    }
    override fun handleOnDestroy() { jobs.cancel(); unlocked = false }
}
