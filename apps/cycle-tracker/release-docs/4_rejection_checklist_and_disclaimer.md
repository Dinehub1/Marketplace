# App Store Rejection Checklist (Health & AI Apps)

Apple is incredibly strict regarding Health & Fitness apps, especially those referencing AI or making predictions. Complete this checklist before submission.

## 1. Medical App Compliance (Guideline 1.4.1)
- [ ] **Disclaimer Requirement:** Ensure your medical disclaimer is explicitly clear. It MUST state that the app is for informational purposes only and is not FDA/EMA cleared medical software.
- [ ] **Placement:** The disclaimer must be visible inside the app (e.g., in Onboarding, Settings, or a dedicated "Disclaimer" module) and in the App Store description.
- [ ] **No Diagnostic Claims:** Ensure the AI does not claim to "diagnose" conditions like PCOS, Endometriosis, or "guarantee" pregnancy avoidance. Use terms like "Insights," "Predictions," and "Estimates."

## 2. In-App Purchases & Subscriptions (Guideline 3.1.2)
- [ ] **Subscription Terms:** If charging for premium AI features, ensure Apple's standard EULA link and your Privacy Policy are clearly accessible on the paywall.
- [ ] **Restore Protocol:** A functional "Restore Purchases" button MUST be prominently visible on the paywall screen.

## 3. Privacy & Data Collection (Guideline 5.1.1)
- [ ] **Account Deletion:** There MUST be an in-app "Delete Account" button that comprehensively deletes all remote user data (if synced to the cloud).
- [ ] **ATT Prompt (App Tracking Transparency):** If you use analytics/advertising SDKs that track users across other companies' apps, you MUST request tracking permission first.
- [ ] **Third-Party AI Transparency:** The privacy policy must explicitly state if user data is sent to external API endpoints for AI processing (e.g., OpenRouter, OpenAI). Ensure no personally identifiable health payload is sent without anonymization.

## 4. Specific App Requirements (Guideline 4.2)
- [ ] **Minimum Functionality:** The app must provide useful features beyond just a mobile-formatted web page.
- [ ] **App Name Constraints:** Ensure the bundle ID name matches the branding. CycleAI should be consistent throughout.

---

# Medical Disclaimer Template

**App Store Description Footer:**
> **Disclaimer:** CycleAI is designed for informational and educational purposes only. It is not intended to provide specific medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider or doctor regarding any medical conditions or before making significant lifestyle changes based on insights provided by this app. CycleAI should not be used as a primary method of birth control.

**In-App Modal / Settings Alert:**
> **Important Medical Notice**
> CycleAI uses artificial intelligence to estimate menstrual phases based on your personal logged data. These predictions are estimates and are not a substitute for professional medical advice, diagnosis, or treatment. Do not use this app to exclusively prevent pregnancy. If you have concerns about your menstrual health, please consult your physician.
