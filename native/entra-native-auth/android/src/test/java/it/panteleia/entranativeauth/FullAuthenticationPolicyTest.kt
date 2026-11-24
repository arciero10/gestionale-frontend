package it.panteleia.entranativeauth

import org.junit.Assert.*
import org.junit.Test

class FullAuthenticationPolicyTest {
    @Test fun expiryAndClockRollbackFailClosed() {
        val day=86400000L
        assertTrue(FullAuthenticationPolicy.valid(1000,1000,1001,30))
        assertFalse(FullAuthenticationPolicy.valid(1000,1000,999,30))
        assertFalse(FullAuthenticationPolicy.valid(1000,1000+29*day,1000+30*day,30))
        repeat(500){assertTrue(FullAuthenticationPolicy.valid(1000,1000,1000L+it,30))}
    }
}
