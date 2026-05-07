'use client'

// hooks/useDemoMode.ts
// Centralized accessors for demo mode + billing UI visibility.
// All monetization-aware components should consult these hooks rather than
// reading platform settings directly, so the rule lives in one place.
//
// Behaviour when demo mode is ON:
//   - useDemoMode().demoMode === true
//   - useBillingVisibility().showBilling === false
//     (every pricing/billing/upgrade/Stripe surface is hidden)
//   - useDemoMode().treatAsPro === true
//     (FeatureGate / usePlanAccess unlock premium features so the demo can
//      showcase Pro capabilities without paywall friction)
//
// Behaviour when demo mode is OFF:
//   - showBilling === true   (normal SaaS pricing/billing UI)
//   - treatAsPro === false   (real plan logic applies)

import { useContext } from 'react'
import { PlatformSettingsContext } from '@/contexts/PlatformSettingsContext'

export interface DemoModeState {
  demoMode:    boolean
  /** True when premium features should be presented as available for demo. */
  treatAsPro:  boolean
  loading:     boolean
}

export function useDemoMode(): DemoModeState {
  const { demoMode, loading } = useContext(PlatformSettingsContext)
  return {
    demoMode,
    treatAsPro: demoMode,
    loading,
  }
}

export interface BillingVisibility {
  /** True when ALL pricing / billing / upgrade / Stripe UI may be shown. */
  showBilling: boolean
  /** Inverse helper for cleaner JSX. */
  hideBilling: boolean
  isDemoMode:  boolean
}

export function useBillingVisibility(): BillingVisibility {
  const { demoMode } = useContext(PlatformSettingsContext)
  return {
    showBilling: !demoMode,
    hideBilling: demoMode,
    isDemoMode:  demoMode,
  }
}
