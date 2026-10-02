# Privacy & Store Compliance Documentation

## 1. Apple App Store Privacy Questionnaire

**Data Collection:**
- **Contact Info:** Name (if collected during onboarding) - Optional, Not linked to user identity if stored locally only.
- **Health & Fitness:** Menstrual cycle data, symptoms, mood, BBT - Collected for App Functionality. Yes, linked to user identity (if using cloud sync).
- **Usage Data:** Product Interaction - Analytics. 

**Critical Apple Requirement (Health Data):**
Since you collect health/menstrual data, you MUST select "Yes" to collecting health data. 
You must ensure that your Privacy Policy explicitly states:
1. Health data is NOT used for advertising or data brokers.
2. Health data is NOT shared with third parties without explicit consent.
3. Users can delete their data entirely at any time.

---

## 2. Google Play Data Safety Form

**Data Collection and Security:**
- **Does your app collect or share any of the required user data types?** Yes.
- **Is all of the user data collected by your app encrypted in transit?** Yes (assuming HTTPS APIs are used).
- **Do you provide a way for users to request that their data be deleted?** Yes.

**Data Types Collected:**
- **Health and Fitness > Health info:** Collected. Used for App Functionality. User can choose whether this data is collected (by not using the app, or skipping optional logs).
- **Personal Info > Name:** Collected (if used in onboarding).

---

## 3. Privacy Policy Template (Reproductive Health & AI)

*Note: Host this on a public URL (e.g., Notion, Vercel, or standard website) and link it in both stores.*

**Effective Date:** [Date]

**1. Introduction**
Welcome to CycleAI. We are committed to protecting your privacy, especially regarding your sensitive reproductive health information. This Privacy Policy details how we handle your data.

**2. Data We Collect**
- **User-Provided Data:** Name, age, menstrual cycle dates, symptoms, mood, basal body temperature (BBT), and other health metrics you choose to log.
- **Usage Data:** Basic diagnostic data to improve app stability.

**3. How We Use Artificial Intelligence**
CycleAI utilizes AI models to predict your cycle and provide insights. 
- Your health data (cycle lengths, symptoms) is processed securely.
- *[If using OpenAI/OpenRouter APIs]* We transmit necessary, anonymized data over secure (encrypted) connections to third-party AI providers strictly to generate predictions. Your personal identifiers (name, email) are NEVER shared with the AI models.

**4. Data Sharing and Third Parties**
We DO NOT sell, rent, or trade your personal or health data to data brokers, advertisers, or any third party. 

**5. Data Deletion**
You have the right to request the complete deletion of your data at any time through the app settings or by contacting us at [Support Email].

**6. Contact Us**
If you have questions, contact us at [Support Email].
