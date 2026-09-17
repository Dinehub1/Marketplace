# Indian Tax / Regulatory / Payment Framework for a Solo Indore App Developer Receiving Foreign Ad Revenue

**Sections A–D. Research report. Compiled from official and non-official sources; every claim carries a URL and, where visible, a page date.**

> **DISCLAIMER — NOT TAX ADVICE.** This is a research compilation, not tax, legal, accounting or investment advice. Several points below are genuinely contested in Indian practice. Tax law changes frequently and the sources cited were read at a point in time. Engage a Chartered Accountant and, where relevant, a US-India cross-border adviser before acting.

**Scope of facts assumed:** Resident individual / sole proprietor in Indore, Madhya Pradesh; publishes on Google Play and Apple App Store; earns foreign ad revenue (AdMob, AppLovin, Unity, Meta Audience Network, InMobi, AdSense) paid in USD/EUR/SGD-billed by foreign entities.

**Source-tier legend**
- **[OFFICIAL]** — Government of India / RBI / IRS / DGFT / Google's own help centre / Apple's own documentation.
- **[OFFICIAL-ADJACENT]** — statutory-body or bank/industry-body material reproducing official lists (ICAI, FEDAI, HSBC, RBI-sourced bank PDFs).
- **[NON-OFFICIAL]** — commentary, blogs, tax portals (TaxGuru, Vakilsearch, ClearTax, Taxtap, etc.). Used only where no official source was retrievable, and always labelled.

**Important timing note:** the sources read here show the **Income-tax Act, 2025** and **Income-tax Rules, 2026** are in force, with corresponding renumbering (e.g. TRC moved to s.159 and Form 43; e-commerce-operator TDS to s.393(1)). Material published under the Income-tax Act, 1961 still uses the old numbers. Where I quote old-section material I flag that the new-Act equivalent number was **NOT VERIFIED** in this research.

---

## A) GST

### A.1 Is ad-network income an "export of services"? The five statutory conditions

**[OFFICIAL]** Section 2(6) of the Integrated Goods and Services Tax Act, 2017 — reproduced verbatim from the CBIC tax repository:

> "(6) **'export of services'** means the supply of any service when,—
> (i) the supplier of service is located in India;
> (ii) the recipient of service is located outside India;
> (iii) the place of supply of service is outside India;
> (iv) the payment for such service has been received by the supplier of service in convertible foreign exchange *[or in Indian rupees wherever permitted by the Reserve Bank of India]*; and
> (v) the supplier of service and the recipient of service are not merely establishments of a distinct person in accordance with *Explanation* 1 in section 8;"

Source: [CBIC tax repository — IGST Act, Section 2](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_IGST_Act/active/chapteri/section2_v1.00.html). The bracketed rupee alternative in (iv) was inserted by s.2 of the IGST (Amendment) Act, 2018 (No. 32 of 2018), in force w.e.f. **01 February 2019** (footnote on the same page).

**[OFFICIAL]** Section 7(5)(a) of the IGST Act makes a supply where "the supplier is located in India and the place of supply is outside India" an **inter-State supply**. (Section text quoted in the TaxGuru analysis below; the operative sub-clause is standard.)

**Application to the Indore developer — condition-by-condition:**
| Condition | Position for ad-network income |
|---|---|
| (i) supplier located in India | Yes — developer in Indore. |
| (ii) recipient located outside India | Yes — e.g. Google Asia Pacific Pte. Ltd. (Singapore), Google Ireland Ltd., AppLovin (US). |
| (iii) place of supply outside India | Yes, subject to the s.13 default rule for B2B services (location of recipient). *The specific s.13 text was **NOT VERIFIED** by direct fetch in this research.* |
| (iv) payment in convertible forex | Yes — USD/EUR/SGD credited to an Indian bank account. |
| (v) not merely establishments of a distinct person | Yes — the developer has no foreign establishment. |

**Practical caveat flagged:** Ad-network revenue is *advertising space / advertising services*. Whether a given contract is characterised as "advertising services" or as a "royalty/licence" of ad inventory affects the **purpose code** (Part C) and the **US treaty income type** (Part B), but it does **not** change the export-of-services analysis for GST: in both cases the supply is *services* to a foreign recipient.

### A.2 Is export of services zero-rated? Two routes: with IGST (refund) vs under LUT (no IGST)

**[OFFICIAL]** Section 16, IGST Act — "Zero rated supply":

> "(1) 'zero rated supply' means any of the following supplies of goods or services or both, namely:—
> (a) export of goods or services or both; or
> (b) supply of goods or services or both for authorised operations to a Special Economic Zone developer or a Special Economic Zone unit.
> (2) Subject to the provisions of sub-section (5) of section 17 of the Central Goods and Services Tax Act, credit of input tax may be availed for making zero-rated supplies, notwithstanding that such supply may be an exempt supply.
> (3) A registered person making zero rated supply shall be eligible to claim refund of unutilised input tax credit on supply of goods or services or both, **without payment of integrated tax, under bond or Letter of Undertaking**, in accordance with the provisions of section 54 of the Central Goods and Services Tax Act or the rules made thereunder, subject to such conditions, safeguards and procedure as may be prescribed: …"

Source: [CBIC tax repository — IGST Act, Section 16](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_IGST_Act/active/chaptervii/section16_v1.00.html). The page footnotes record that sub-sections (3) and (4) were **substituted by s.123(b) of the Finance Act, 2021, in force w.e.f. 01 October 2023** (Notification No. 27/2023-C.T. dated 31 July 2023). The pre-2023 text offered an explicit *either/or* menu — (a) supply under bond/LUT without payment of IGST and claim refund of unutilised ITC, or (b) supply on payment of IGST and claim refund of the IGST paid. The current (post-01.10.2023) text retains the LUT/bond route in sub-section (3) and empowers the Government to notify classes of persons/goods/services that may pay IGST and claim refund under sub-section (4).

**So: "zero-rated" ≠ "exempt".** Zero-rated is a *taxable* supply at 0% where input tax credit remains available (s.16(2)). The two practical routes are:

| Route | What happens | Governing provision |
|---|---|---|
| **Without payment of IGST (LUT/bond)** | Invoice without IGST; claim refund of **unutilised input tax credit** | s.16(3) IGST Act + Rule 96A CGST Rules |
| **With payment of IGST, then refund** | Charge IGST on the export invoice, pay it, then claim refund of the IGST paid | s.16(4) IGST Act (as notified) + s.54 CGST Act |

### A.3 LUT, Form GST RFD-11, and Rule 96A — the mechanics

**[OFFICIAL]** Rule 96A of the CGST Rules, 2017 — "Export of goods or services under bond or Letter of Undertaking":

> "(1) Any registered person availing the option to supply goods or services for export without payment of integrated tax shall furnish, prior to export, **a bond or a Letter of Undertaking in FORM GST RFD-11** to the jurisdictional Commissioner, binding himself to pay the tax due along with the interest specified under sub-section (1) of section 50 within a period of —
> …
> (b) fifteen days after the expiry of one year, **or the period as allowed under the Foreign Exchange Management Act, 1999**, including any extension of such period as permitted by the Reserve Bank of India, whichever is later, from the date of issue of the invoice for export, or such further period as may be allowed by the Commissioner, if the payment of such services is not received by the exporter in convertible foreign exchange or in Indian rupees, wherever permitted by the Reserve Bank of India."
> "(5) The Board, by way of notification, may specify the conditions and safeguards under which a Letter of Undertaking may be furnished in place of a bond."

Source: [CBIC tax repository — CGST Rules, Rule 96A](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96a_v1.00.html). The Rule 96A page links directly to **FORM GST RFD-11** in the CBIC forms repository: [explore-forms/1000116](https://taxinformation.cbic.gov.in/content-page/explore-forms/1000116).

**Is a LUT required to export services without paying IGST?** Yes — Rule 96A(1) says a registered person availing the "without payment of integrated tax" route **shall furnish, prior to export**, a bond **or** a Letter of Undertaking in FORM GST RFD-11. A LUT is the lighter option (no bank guarantee), available where the Board's conditions are met.

**LUT conditions notification — [NOT VERIFIED]:** the conditions and safeguards for furnishing an LUT in place of a bond are prescribed by notification (commonly cited as **Notification No. 37/2017-Integrated Tax dated 04.10.2017**, with a Rs 5 crore turnover ceiling and an exclusion for persons prosecuted for tax evasion). I could **not** retrieve the CBIC-hosted original in this research; the notification number, date and threshold are therefore **NOT VERIFIED from an official source**. Corroborating NON-OFFICIAL commentary: [CAIN India note, October 2017](https://www.cainindia.org/news/10_2017/facility_of_lut_extended_to_all_exporters_registered_persons_subject_to_conditions.html). **[NON-OFFICIAL]**

**Practical LUT mechanics (NON-OFFICIAL):** LUT is filed electronically on the GST portal for a financial year and is valid for the whole of that year; a LUT filed late can still cover earlier exports in the year. Sources: [Vakilsearch — LUT under GST](https://vakilsearch.com/article/lut-under-gst-export-of-services-india/) **[NON-OFFICIAL]**; [IndiaFilings — Letter of Undertaking](https://www.indiafilings.com/learn/gst-letter-of-undertaking-lut-applicability-and-procedure) **[NON-OFFICIAL]**. On late-LUT refunds there is case law (Karnataka High Court) — e.g. [Masters India summary](https://www.mastersindia.co/blog/gst-refund-late-lut-filing/) **[NON-OFFICIAL]**.

### A.4 Is GST registration MANDATORY for a service exporter below Rs 20 lakh?

This is the single most contested question in the brief and there is **no clean official "yes" or "no"**. Here is the statutory architecture, and then the honest state of the debate.

**The three relevant CGST provisions**

**[OFFICIAL]** Section 24 (Compulsory registration in certain cases), CBIC tax repository — opening words and clause (i):

> "Notwithstanding anything contained in sub-section (1) of section 22, the following categories of persons shall be required to be registered under this Act,—
> **(i) persons making any inter-State taxable supply;** …"

Source: [CBIC tax repository — CGST Act, Section 24](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter6/section24_v1.00.html). *(Note the URL uses the lowercase `2017_CGST_act` path; the `chapteriv` variant returns HTTP 500.)*

**[OFFICIAL — quoted in NON-OFFICIAL host]** Section 23(1): persons "engaged exclusively in the business of supplying goods or services or both **that are not liable to tax or wholly exempt** from tax under this Act or under the Integrated Goods and Services Tax Act" are **not liable to registration**; s.23(2) lets the Government notify exempt categories. Section 22(1) sets the Rs 20 lakh aggregate-turnover threshold. Text quoted in [TaxGuru, "Whether GST Registration Mandatory for Persons Making Export of Services?", 15 March 2025](https://taxguru.in/goods-and-service-tax/gst-registration-mandatory-persons-making-export-services.html). **[NON-OFFICIAL host; the statutory text itself is standard]**

**The critical carve-out — Notification No. 10/2017-Integrated Tax dated 13 October 2017**

This notification uses s.20 of the IGST Act read with **s.23(2) of the CGST Act** to exempt a category of persons from registration. Full text as reproduced by TaxGuru:

> "G.S.R. 1260(E).— In exercise of the powers conferred by section 20 of the Integrated Goods and Services Tax Act, 2017 (13 of 2017) read with sub-section (2) of section 23 of the Central Goods and Services Tax Act, 2017 (12 of 2017) …, the Central Government, on the recommendations of the Council, hereby specifies **the persons making inter-State supplies of taxable services and having an aggregate turnover, to be computed on all India basis, not exceeding an amount of twenty lakh rupees in a financial year** as the category of persons exempted from obtaining registration under the said Act:
> Provided that the aggregate value of such supplies … should not exceed an amount of ten lakh rupees in case of 'special category States' as specified in sub-clause (g) of clause (4) of article 279A of the Constitution, other than the State of Jammu and Kashmir."
> [F. No.349/74/2017-GST (Pt.)] — (Dr. Sreeparvathy S.L.), Under Secretary to the Government of India

Source (full reproduction): [TaxGuru, "GST not payable on inter-State supplies of taxable services by exempt persons", 13 October 2017](https://taxguru.in/goods-and-service-tax/gst-not-payable-on-inter-state-supplies-of-taxable-services-by-exempt-persons.html). **[NON-OFFICIAL host — see verification flag below]**

**[OFFICIAL-ADJACENT corroboration]** An ICMAI compilation of GST notifications lists: *"10/2017-Integrated Tax | 13/10/2017 | Seeks to exempt persons making inter-State supplies of taxable services from registration…"* — [ICMAI, Compilation of GST Notifications, p.17](https://icmai.in/upload/Taxation/Compilation_GST_Notifications.pdf). This independently corroborates the notification's existence, number, date and subject matter. **[OFFICIAL-ADJACENT / professional body]**

> ⚠️ **VERIFICATION FLAG [NOT VERIFIED]:** I could **not** retrieve the **CBIC-hosted original** of Notification No. 10/2017-Integrated Tax (the `taxinformation.cbic.gov.in` notification explorer URLs returned errors / could not be located by ID in this research). The full operative text above comes from a non-official reproduction, corroborated on number/date/subject by an ICAI/ICMAI-tier source. **Verify the original on cbic.gov.in or gst.gov.in before relying on it.**

**The competing readings — both are argued in practice**

| Reading | Argument | Source |
|---|---|---|
| **No registration required** (if you don't want ITC/refund and are below Rs 20 lakh) | Export of services is a **zero-rated** supply, and Notification 10/2017-IT exempts inter-State suppliers of taxable services up to Rs 20 lakh from registration u/s 23(2). Separately, s.24(i) bites only on "inter-State **taxable** supply", and a person *exclusively* exporting may fall in s.23(1) because zero-rated supply is treated as exempt for ITC purposes under s.16(2). | [TaxGuru 15 Mar 2025](https://taxguru.in/goods-and-service-tax/gst-registration-mandatory-persons-making-export-services.html) **[NON-OFFICIAL]**; [Vakilsearch — GST registration for exporters](https://vakilsearch.com/article/gst-registration-for-exporters-india/) **[NON-OFFICIAL]** |
| **Registration required in practice** (to claim refund / file LUT / satisfy counterparties) | Refunds of unutilised ITC and LUT-based export under s.16(3) are available only to a **"registered person"** (express words of s.16(3) and Rule 96A(1)). Many ad networks and most banks ask for a GSTIN/invoice. So although a pure exporter *may* arguably not be compelled to register, **registration is what unlocks the zero-rating machinery**. | s.16(3) IGST + Rule 96A **[OFFICIAL]**; [TaxGuru 15 Mar 2025](https://taxguru.in/goods-and-service-tax/gst-registration-mandatory-persons-making-export-services.html) **[NON-OFFICIAL]** |

**Note on the goods analogy:** the widely-quoted inter-State **goods** registration exemption (Rs 20 lakh / Rs 10 lakh special-category) is a *separate* notification regime. The services exemption rests on Notification 10/2017-Integrated Tax above; I did **not** find a distinct official CBIC circular expressly confirming that a pure services exporter below Rs 20 lakh needs no GSTIN. **[NOT VERIFIED as an official confirmation]**

**Practical bottom line:** the widely-observed market practice among Indian app developers earning foreign ad revenue is to **register for GST and file an LUT**, because (a) it is the only way to claim input tax credit refunds, (b) some ad networks/banks ask for a GSTIN or GST invoice, and (c) it removes the s.24(i) dispute entirely. The legal argument that a sub-Rs-20-lakh *pure* service exporter need not register is credible but untested here.

### A.5 What the ad networks themselves require — Google and InMobi

**InMobi — [OFFICIAL, vendor's own help centre].** This is the clearest, most explicit requirement in the whole brief:

> **"1. Why has my payment been delayed?** Payments may be delayed for the following reasons: **Publishers registered in Singapore and India are required to send GST invoices. If exempted from GST, they must provide a declaration via email to bd-finance@inmobi.com.** Incorrect bank details. …"

Source: [InMobi Support Center — Finance & Payments FAQ](https://support.inmobi.com/monetize/cat-faqs/finance-payments) (page timestamp on fetch: **08 August 2026**). The same page states India minimum payout is **$50**, payment cycle **60 days after month-end**, and that invoices must be **PDF**. → **This directly answers the brief: InMobi requires either a GST invoice or a written GST-exemption declaration from Indian publishers.**

**Google — contracting entity for India is Google Asia Pacific Pte. Ltd. (Singapore) — [OFFICIAL].** AdMob's contracting-entity help page lists **India** among the countries/tax territories covered by the **Google Asia Pacific Pte. Ltd.** entity (alongside Singapore, Australia, Japan, etc.), and gives Google Asia Pacific's Singapore GST number as **200817984R**, address Mapletree Business City II, 70 Pasir Panjang Road, #03-71, Singapore 117371. Source: [AdMob Help — "Contracting entity is Google Asia Pacific Pte. Ltd."](https://support.google.com/admob/answer/4385995?hl=en).

> ⚠️ **Important trap.** That same page's "GST invoice" instructions are for **Singapore GST** and apply to publishers "with a billing address in Singapore" — not Indian GST. Many blog posts misread this page as an Indian-GST invoice requirement. The page's invoice fields are: the words "Tax invoice", your name/address, **your GST registration number**, invoice date and number, Google Asia Pacific's GST number, its full name/address, description of services (e.g. internet advertising services), payment date and number, taxable amount excluding GST, **the current GST rate in Singapore**, GST amount (in **S$**), total including GST, and net payable. Sources must be submitted as PDF via the [Singapore GST invoice submission form](https://support.google.com/adsense/contact/singapore_gst_claim). **[OFFICIAL — Google]** → **I found no Google help page requiring an Indian GSTIN from an India-address AdSense/AdMob publisher. [NOT VERIFIED as a requirement.]**

**Google Play (separate product) — [OFFICIAL, Google].** Google's Payments Center India section says:

> "**Developers located in India** — If you are located in India, **it is your responsibility to determine whether you need to obtain a Goods and Services Tax Identification Number (GSTIN)** and to determine any applicable tax on sale of apps/ in apps to users in India. Further, it is your responsibility to determine and pay applicable taxes on any Google Play service fees charged by Google to you.
> **Google is responsible for deducting and depositing appropriate Income withholding tax (Tax Deduction at Source) and GST TCS (Tax Collection at Source), if any, on account of paid apps and games (including in-app purchases) sold by you.**
> …
> **Submit your GSTIN** — Developers located in India that are required to obtain a registration under GST law must provide their GSTIN to Google. … We will verify the number against the government database. …
> **Why are we collecting taxes?** The government of India requires Google to comply with certain tax laws which are applicable to an e-commerce operator. This includes withholding applicable income withholding tax under **section 393(1)[Table: S.No. 8(v)] of the Income Tax Act, 2025** and collection of applicable GST under **section 52 of the Central Goods and Services Tax Act, 2017**."

Source: [Google Payments Center Help — "Tax residency information and Non-US withholding & reporting"](https://support.google.com/paymentscenter/answer/13401799?hl=en) → **India** section. **[OFFICIAL — Google】**

**Two critical distinctions:**
1. The Google Play TDS/GST-TCS obligations above arise from **paid apps and in-app purchases sold *to users in India*, where Google acts as an e-commerce operator/marketplace.** They are **not** about AdMob ad revenue.
2. The same page states, for India: **"We do not require a tax residency certificate for India."** **[OFFICIAL — Google]** — i.e. Google does not demand an Indian TRC for the Google Play India flow. This sits in tension with the AdMob page, which *does* list a TRC name for India (see Part B).

**Verify one more thing you will see in the wild:** Google Play requires the **developer/payment-profile account type** to be consistent, and there are help-forum threads about individual vs organisation mismatches ([Google Play Help thread](https://support.google.com/googleplay/android-developer/thread/307637129/should-the-play-console-account-type-be-same-as-payment-profile-account-type?hl=en)) **[OFFICIAL-forum, i.e. community content, not policy]**.

### A.6 OIDAR and reverse charge on "import of services"

**The statutory definitions are on the official CBIC page already cited.** From [IGST Act s.2](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_IGST_Act/active/chapteri/section2_v1.00.html):

- **s.2(11) "import of services"** = supply of any service where (i) the supplier is located outside India, (ii) the recipient is located in India, and (iii) the place of supply is in India.
- **s.2(17) "online information and database access or retrieval services" (OIDAR)** — services whose delivery is mediated by IT over the internet or an electronic network … and **includes electronic services such as: "(i) advertising on the internet;"** and "(vi) digital data storage".
- **s.2(16) "non-taxable online recipient"** = any unregistered person receiving OIDAR services located in the taxable territory (substituted by the Finance (No. 8) Act, 2023, in force **01 October 2023**, per the same page's footnote).

**[OFFICIAL]** s.24(xi) CGST Act requires registration for "every person supplying online information and database access or retrieval services **from a place outside India to a person in India, other than a registered person**" — i.e. the OIDAR registration duty falls on the **foreign supplier** (e.g. a foreign ad network selling ad-tech/OIDAR to Indian customers), *not* on the Indian publisher. Source: [CBIC — CGST s.24](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter6/section24_v1.00.html).

**Direction of the transaction matters — this is the key point for the brief:**

| Direction | GST treatment | Status of verification |
|---|---|---|
| **Foreign ad network → pays the Indian publisher** (the ordinary AdMob/AppLovin case) | This is the Indian publisher *supplying* advertising **services** to a foreign recipient → **export of services**, zero-rated per A.2. The Indian publisher is the **supplier**, not the importer. | **[OFFICIAL]** s.2(6)/s.16 IGST |
| **Foreign supplier → charges the Indian publisher** (e.g. Apple's annual Developer Program fee, Google Cloud, foreign SaaS, or any network that deducts a fee) | This is **import of services** by the Indian publisher under s.2(11), and the **Indian recipient** must examine **reverse charge** liability under s.5(3) IGST Act read with the notified RCM categories. | **Mechanics NOT VERIFIED** — see flag |

> ⚠️ **[NOT VERIFIED] — reverse charge on imported services.** I did **not** retrieve the IGST reverse-charge notification (commonly cited as **Notification No. 10/2017-Integrated Tax (Rate)**, which specifies categories of inter-State services on which the recipient pays under RCM) from a CBIC-hosted original, and I did **not** verify whether any *de minimis* exemption applies. **A foreign SaaS/ad-tech/developer-program fee charged to an unregistered Indian individual is the classic case where RCM registration under s.24(iii) is triggered** — do not treat this as settled from this report. Verify with a CA. **[NON-OFFICIAL commentary on RCM categories: [TaxGuru, "IGST: Services under reverse charge mechanism"](https://taxguru.in/goods-and-service-tax/igst-services-reverse-charge-mechanism.html)]**

**"Bill to Ship To" — [NOT VERIFIED].** The brief asks about a "Bill to Ship To" angle. I found nothing establishing a Bill-to/Ship-to issue in a publisher↔ad-network services relationship; that concept is a goods-supply construct (s.10(1)(b) IGST place-of-supply for goods). **I could not verify any application to ad-network export of services, and I believe there is none.** Treat as **NOT VERIFIED / likely not applicable**.

---

## B) Income Tax / TDS / US Withholding

### B.1 Head of income, and which ITR

- **Head of income:** foreign ad revenue of a resident sole proprietor is **business income** (Profits and Gains of Business or Profession) — the developer runs an ongoing commercial activity of monetising apps, not a one-off receipt. This is the settled framing, and it is the premise on which both presumptive schemes below operate. **[Indirectly OFFICIAL — the presumptive-scheme pages cited in B.2 treat business/profession receipts this way]**
- **ITR form:** presumptive opters use **ITR-4 (SUGAM)**; if you do not opt for presumptive taxation or your income exceeds the presumptive ceilings, **ITR-3** with a full P&L. **[OFFICIAL-ADJACENT — the incometaxindia "Small Businessmen" page notes ITR-4 for presumptive cases, e.g. the e-filing exemption row references "ITR-1 or ITR-4"]**. *I did not fetch the current-year ITR-4 instruction sheet; the specific ITR-form mapping for AY 2026-27 is **[NOT VERIFIED]** from a primary source in this research.*
- **Currency conversion:** foreign-currency receipts are converted to INR for tax. The rule is **Rule 115 of the Income-tax Rules** (SBI TT buying rate on the specified date — for income, generally the last day of the previous year for such income, with the proviso that where the income is received in convertible forex, the rate on the date of receipt applies if the taxpayer so elects). ⚠️ **[NOT VERIFIED]** — I did not fetch Rule 115 / the corresponding Rule in the Income-tax Rules, 2026 in this research. **Confirm the current rule number and the receipt-date election with your CA, because the receipt-date rate is materially more favourable in a depreciating-rupee year.**

### B.2 Section 44AD vs 44ADA — the central practical question for an app developer

**[OFFICIAL]** Rates and thresholds, from the Income Tax Department's own "Small Businessmen — Benefits allowable" page:

| Scheme | Presumptive rate | Threshold | Cash-condition uplift |
|---|---|---|---|
| **s.44AD** (eligible business) | **8%** of gross turnover/receipts; **6%** where receipts are by account-payee cheque/draft/ECS/other prescribed electronic mode | **Rs 2 crore** | If cash received ≤ 5% of total turnover/receipts, threshold becomes **Rs 3 crore** |
| **s.44ADA** (profession) | **50%** of gross receipts | **Rs 50 lakh** | If cash received ≤ 5% of total gross receipts, threshold becomes **Rs 75,00,000** |

Source: [incometaxindia.gov.in — "Small Businessmen – Benefits allowable"](https://www.incometaxindia.gov.in/w/small-businessmen-benefits-allowable). **[OFFICIAL]**

The same official page (Section E, "Tax Deducted at Source and Advance Tax") states:
- "**No need to pay advance tax in installments by assessee who has opted for presumptive taxation scheme under Section 44AD or 44ADA** — Whole amount of advance tax can be paid in **one installment on or before 15th March** of the financial year."
- "Liability for payment of advance tax … Taxpayer is liable to advance tax only if his advance tax liability is **Rs 10,000 or more**" (s.208).
- Under Section C: "**Compulsory Audit of books of accounts** … 44AB … **Note: (a) This section is not applicable to the person, who opts for presumptive taxation Scheme under Section 44AD/44ADA.**"
- Under Section D: rebate u/s 87A for a resident individual under the s.115BAC(1A) regime where total income does not exceed **Rs 12,00,000**, maximum rebate **Rs 60,000**, "**effective from AY 2026-27**". (The older 115BAC regime showed a Rs 5,00,000 / Rs 12,500 rebate and a Rs 4,00,000 basic exemption.)
- Under Section C: an individual/HUF must maintain books only when gross turnover/gross receipts exceed **Rs 25,00,000** or business/profession income exceeds **Rs 2,50,000**.

**[OFFICIAL]** The Income Tax Department's own FAQ page, **"Which businesses are not eligible for presumptive taxation scheme of section 44AD?"**, answers:

> "The scheme of section 44AD is designed to give relief to small taxpayers engaged in any business, **except the following businesses:**
> • Business of plying, hiring or leasing goods carriages referred to in sections 44AE.
> • **A person who is carrying on any agency business.**
> • **A person who is earning income in the nature of commission or brokerage.**
> • Any business whose total turnover or gross receipts exceeds two crore rupees. [with the Rs 3 crore / 5%-cash uplift, AY 2024-25 onwards]
> Apart from above discussed businesses, **a person carrying on profession as referred to in section 44AA(1) is not eligible for presumptive taxation scheme under section 44AD.**"

Source: [incometaxindia.gov.in — FAQ on s.44AD eligibility](https://www.incometaxindia.gov.in/w/which-businesses-are-not-eligible-for-presumptive-taxation-scheme-of-section-44ad-). **[OFFICIAL]**

**Why this matters for an Indore app developer — and the honest answer.** Section 44AA(1)'s "specified professions" historically include **technical consultancy** (alongside legal, medical, engineering, architecture, accountancy, interior decoration and notified professions). So:

- **If app development is treated as a "profession" (technical consultancy)** → **44AD is unavailable** (express exclusion above), and you fall to **44ADA** at 50% deemed profit, but with a **Rs 50 lakh (Rs 75 lakh with ≤5% cash) ceiling** — above which you must keep books and get audited.
- **If app development / ad monetisation is treated as a "business"** → **44AD** applies at **6% (digital receipts)** on turnover, with a **Rs 2 crore / Rs 3 crore** ceiling — dramatically better: a 6% deemed-profit base versus 50%.

This is **genuinely contested**, and the characterisation turns on facts (do you hold yourself out as providing technical consultancy? is the revenue from licensing an app product rather than rendering consultancy?) as well as on how the assessing officer reads it. **I did not find an official CBDT circular or a notified profession list entry that squarely resolves "app developer / ad-monetised mobile app" one way or the other. [NOT VERIFIED — no official resolution located.]**

NON-OFFICIAL commentary that engages this split directly includes [Taxtap — "44ADA for YouTube AdSense Income in India"](https://www.taxtap.in/platform/youtube-adsense/44ada) and [Taxtap — "GST for Coaches: Registration, LUT & Compliance"](https://www.taxtap.in/profession/coach/gst) **[both NON-OFFICIAL]**. These are commentary, not authority.

**Practical read (not advice):** many practitioners place a solo app developer *with foreign ad income* under **44AD as a business** (treating the app as a product/business asset), but the 44AA(1) "technical consultancy" exclusion is a real audit risk. Note also the **s.44AD(4)/(5) lock-in**: if you opt for 44AD and later opt out, you may be barred from the scheme for the next five assessment years — ⚠️ **[NOT VERIFIED]** by direct fetch of the proviso in this research.

### B.3 Does the foreign ad network withhold Indian TDS? Does anything?

**Short answer: No Indian TDS is withheld by the foreign payer.** Indian TDS machinery under the Income-tax Act operates on a **resident payer** making specified payments, or on **any payer making payments to a non-resident**. It does not require a non-resident payer to deduct Indian tax on payments to an Indian resident.

**[OFFICIAL]** Google's own Payments Center page states the US-Chapter-3 position from the payer side: "**Google has a regulatory responsibility under Chapter 3 of the US Internal Revenue Code to withhold tax and report where a non-US partner receives US source income.**" — i.e. Google withholds under **US** law (Chapter 3 / §1441), **not** Indian law. [Google Payments Center — "US tax information reporting & withholding"](https://support.google.com/paymentscenter/answer/10349995?hl=en) **[OFFICIAL — Google]**

**Consequences for the Indian developer:**
- No TDS credit will appear in **Form 26AS / AIS** from these foreign receipts, because no Indian deductor is involved.
- Therefore income tax on the foreign ad revenue must be discharged by **advance tax** (s.207–211) and/or **self-assessment tax**, with **s.234B/234C interest** if short-paid.
- Advance tax still applies to presumptive taxpayers — but **[OFFICIAL]** as noted in B.2, a 44AD/44ADA opter may pay the **entire** advance tax in one instalment by **15 March** of the financial year, and is liable only if the liability is **Rs 10,000 or more** ([incometaxindia — Small Businessmen page](https://www.incometaxindia.gov.in/w/small-businessmen-benefits-allowable)).
- ⚠️ **[NOT VERIFIED — partially]:** whether any *Indian* TDS provision (e.g. an e-commerce-operator provision) can reach these receipts. Note that **Google Play India** *does* involve Indian TDS — but that is TDS **Google deducts on Indian-user app sales**, quoted in A.5 as **s.393(1) Table S.No. 8(v) of the Income-tax Act, 2025** (old-Act equivalent commonly cited as s.194-O). This is a *different* income stream from foreign ad revenue, and it *will* show in your 26AS. **Do not conflate the two.**

### B.4 US withholding tax: W-8BEN vs W-8BEN-E, and the India–US treaty

**Which form does a sole proprietor sign? — [OFFICIAL, IRS].** The IRS instructions for Form W-8BEN (revised **10/2021**) are decisive:

> "**Who Must Provide Form W-8BEN** — You must give Form W-8BEN to the withholding agent or payer if you are a **nonresident alien** who is the beneficial owner of an amount subject to withholding… **If you are the single owner of a disregarded entity, you are considered the beneficial owner of income received by the disregarded entity.** Submit Form W-8BEN when requested by the withholding agent, payer, or FFI **whether or not you are claiming a reduced rate of, or exemption from, withholding.**
> **Do not use Form W-8BEN if you are described below.**
> • **You are a foreign entity** documenting your foreign status, documenting your chapter 4 status, or claiming treaty benefits. **Instead, use Form W-8BEN-E.**
> • You are a U.S. citizen (even if you reside outside the United States) or other U.S. person… use Form W-9.
> • You are acting as a foreign intermediary… use Form W-8IMY.
> • You are a nonresident alien individual who claims exemption from withholding on compensation for independent or dependent personal services performed in the United States. Instead, provide Form 8233 or Form W-4.
> • You are receiving income that is effectively connected with the conduct of a trade or business in the United States… provide Form W-8ECI."

Source: [IRS — Instructions for Form W-8BEN (10/2021)](https://www.irs.gov/instructions/iw8ben). **[OFFICIAL — IRS]**

→ **A sole proprietor / individual Indian developer signs Form W-8BEN, NOT W-8BEN-E.** A proprietorship is not a separate legal entity; the individual is the beneficial owner. W-8BEN-E is for **entities** (companies, LLPs, partnerships, trusts).

**[OFFICIAL — Google]** Google's own guidance confirms the same fork: "A **Form W-9** will be required from US persons… Generally, a **Form W-8BEN** or **Form W-8BEN-E** is required from **individuals and entities (respectively)** outside of the US who are the beneficial owner of the income received. It may be used to claim a treaty benefit (in other words, a reduced rate of withholding)." Source: [Google Payments Center — US tax information reporting & withholding](https://support.google.com/paymentscenter/answer/10349995?hl=en). **[OFFICIAL — Google]**

**Validity / refresh period — [OFFICIAL, IRS].** The IRS instructions say:

> "**Expiration of Form W-8BEN.** Generally, a Form W-8BEN will remain in effect for purposes of establishing foreign status for a period starting on the date the form is signed and ending on the **last day of the third succeeding calendar year**, unless a change in circumstances makes any information on the form incorrect. … **However, under certain conditions a Form W-8BEN will remain in effect indefinitely until a change of circumstances occurs.** To determine the period of validity … for purposes of chapter 3, see Regulations section 1.1441-1(e)(4)(ii)."
> "**Change in circumstances.** If a change in circumstances makes any information on the Form W-8BEN you have submitted incorrect, you must notify the withholding agent … **within 30 days** of the change in circumstances and you must file a new Form W-8BEN or other appropriate form."

Source: [IRS — Instructions for Form W-8BEN](https://www.irs.gov/instructions/iw8ben). **[OFFICIAL — IRS]**

**[OFFICIAL — Google]** Google in practice applies a **three-year refresh**: "The Internal Revenue Service ('IRS') requires Google to **refresh its non-US partners and vendors tax forms at the earlier of (1) every 3 years or (2) If there has been a change in circumstances that would impact the validity of the form.**" Source: [Google Payments Center — US tax information reporting & withholding](https://support.google.com/paymentscenter/answer/10349995?hl=en). **[OFFICIAL — Google]**

**Line 10 — the treaty-claim line that matters here — [OFFICIAL, IRS].** The IRS instructions state that line 10 must be completed by, among others:

> "**Persons claiming treaty benefits on business profits or gains that are not attributable to a permanent establishment** … must complete this line. … Complete line 10 by stating that you derive business profits or gains (other than from real property) **not attributable to a permanent establishment**. **You must also include the relevant treaty article.**"
> "**Persons claiming treaty benefits on royalties must complete this line if the treaty contains different withholding rates for different types of royalties.**"

Source: [IRS — Instructions for Form W-8BEN](https://www.irs.gov/instructions/iw8ben). **[OFFICIAL — IRS]**

**How Google characterises ad revenue — this is the single most important finding in Part B.** Google's own help page maps Google products to treaty income types:

> "**Why are there multiple payment types and which do I select?** … To help you decide which payment types relate to your partnership with Google, use the following:
> • **Other Copyright Royalties** (such as YouTube Partner Program, Cloud Marketplace - Reseller Model and Play Pass)
> • **Services or other business income (such as AdSense, but not including AdSense for YouTube)**
> • Motion Picture & TV Royalties"

Source: [Google Payments Center — US tax information reporting & withholding](https://support.google.com/paymentscenter/answer/10349995?hl=en). **[OFFICIAL — Google]**

→ **Google classifies AdSense/AdMob-type revenue as "Services or other business income", NOT as a royalty.** That points to the **business-profits** article of the India–US treaty, for which the IRS form instruction requires the **permanent-establishment (PE)** representation on **line 10** of the W-8BEN. A solo Indore developer with no US employees, no US equipment and no US fixed place of business generally **has no US permanent establishment** — and Google's own "About US Activities" page supports that: "**Generally, utilizing an unrelated third-party US web hosting service** to host your webpages or web applications, renting web servers that are located in the US from an unrelated third party, or having your payment sent to a US Post Office Box or mail forwarding address, **do not of themselves constitute US Activities.**" Source: [AdMob Help — "About US Activities"](https://support.google.com/admob/answer/2772627?hl=en). **[OFFICIAL — Google]**

> ⚠️ **Do not read this as "0% withholding is guaranteed."** Google decides the applicable rate from the tax form + treaty claim: "The US withholding tax rate that applies is based on the tax documentation you've provided to Google. **If a valid tax form isn't provided, Google may apply backup withholding at 24% or chapter 3 withholding at 30% on applicable payments. This rate may only be reduced if you're a tax resident of a country or region that has an income treaty with the US and you provide a valid tax form with a valid treaty claim.**" Source: [Google Payments Center](https://support.google.com/paymentscenter/answer/10349995?hl=en) **[OFFICIAL — Google]**. Google also states: "**only the portion of your revenue earned from US users is subject to US withholding taxes and reporting.**" (same page). Whether the treaty ultimately yields **0%** on business profits with no US PE is a **legal conclusion I did not verify against the treaty text** — see the flag below.

**The royalty rate, for comparison — [OFFICIAL, Government of India].** The Embassy of India (Washington DC) publishes Indo-US DTAA withholding rates: **Royalty 10%/15% [Note 1]** and **Fee for Technical Services 10%/15% [Note 1]**, with Note 1 stating "Royalties and fees for technical services would be taxable in the country of source at the rates prescribed for different categories of royalties and fees for technical services. These rates shall be subject to various conditions and nature of services/royalty for which payment is made." Source: [Embassy of India, Washington DC — TDS (Withholding tax) rates under Indo-US DTAA](https://www.indianembassyusa.gov.in/taxdata?id=9) (page last updated **28 August 2026**). **[OFFICIAL — Government of India]**

> ⚠️ **[NOT VERIFIED] — Article 12 tiers and the Article 7 rate.** I did **not** fetch the India–US DTAA treaty text itself (Article 7 Business Profits; Article 12 Royalties and Fees for Included Services) from an official host. The **10%/15%** royalty split is verified only as a headline table. The exact Article 12 sub-paragraph allocation, and the precise withholding rate Google applies to an Indian resident claiming "Services or other business income" under Article 7, are **NOT VERIFIED**. Verify against the treaty text and, ideally, against the rate showing in your own Google payments profile ("Find relevant withholding rates in your payments profile under **Settings → Manage tax info**" — per Google's page above).

### B.5 What Google requires: tax info pages, TRC, and Form 43

**Google's tax-info entry points — all [OFFICIAL — Google]:**
- AdMob — **"Submit your US tax info to Google"**: [support.google.com/admob/answer/2772513](https://support.google.com/admob/answer/2772513?hl=en). Path: AdMob → **Payments** → **Manage settings** → **Payments profile** → edit next to "United States tax info" → **Manage tax info**. Tax info must be provided **before the 20th of the month** to receive payment that month.
- AdMob — **"Submit your non-US tax info to Google"**: [support.google.com/admob/answer/14135099](https://support.google.com/admob/answer/14135099?hl=en). Contains the **Official names of TRCs for selected countries** table.
- AdMob — **"Steps to getting paid"** (earning minimum $10; identity verification; PIN/address verification; bank details; **payment threshold, e.g. $100 USD**; payments issued "on or around the **21st of the month**"): [support.google.com/admob/answer/3001066](https://support.google.com/admob/answer/3001066?hl=en).

**The India TRC name — and a direct conflict between two Google pages. This is important and I am reporting it as-is:**

| Google page | What it says the Indian TRC is | Under which Act |
|---|---|---|
| **AdMob Help — "Submit your non-US tax info to Google"** ([answer/14135099](https://support.google.com/admob/answer/14135099?hl=en)) | **"Certificate of Residence for the Purposes of Section 159 in Form 43"** (listed identically for both Entities and Individuals) | **Income-tax Act, 2025** (s.159) |
| **Google Payments Center — "Tax residency information and Non-US withholding & reporting"** ([answer/13401799](https://support.google.com/paymentscenter/answer/13401799?hl=en)) | **"Certificate of Residence for the Purposes of Section 90 and 90A in Form 10FB"** | **Income-tax Act, 1961** (ss.90/90A) |

Both are Google's own pages; they have not been updated in lockstep. **The AdMob table (Form 43, s.159) reflects the current Act; the Payments Center table still shows the erstwhile Form 10FB.** So the brief's premise is **correct**: Google's AdMob TRC table does name India as *"Certificate of Residence for the Purposes of Section 159 in Form 43"*.

**What Google demands for India specifically — [OFFICIAL — Google].** From the AdMob non-US tax page:
- A TRC must be "a **government-issued document created for the purpose of validating tax residency**"; "If the TRC indicates a country related to a tax treaty, the treaty must pertain to the country."
- Documents are rejected if blurry, expired, missing pages/signature, or if "organization name, address … does not exactly match the information in your AdMob payments profile."
- Reviews "may take up to **7 business days**."
- **Critically, Google notes:** "The status of tax residency information related to **tax exemption with Ireland or Singapore** will not result in account limitations, or impact payouts or withholding tax." Since **India-address AdMob publishers contract with Google Asia Pacific Pte. Ltd. (Singapore)** (see A.5), this strongly suggests **no Google-side withholding arises on the Singapore-contracted AdMob flow** — which is consistent with Google's separate $100-threshold, no-deduction payment description in the "Steps to getting paid" page.

**But the Payments Center page says the opposite for India on TRC:** "**We do not require a tax residency certificate for India.**" (India section, [answer/13401799](https://support.google.com/paymentscenter/answer/13401799?hl=en)). **[OFFICIAL — Google]**

> **Net practical reading:** Google's India guidance is **internally inconsistent** as between the AdMob help centre and the Payments Center. The safest posture for an Indian publisher is to (a) complete the online tax interview (which auto-selects W-8BEN for an individual), (b) **keep a Form 43 TRC ready to upload if Google's AdMob flow asks for it**, and (c) treat the "no TRC needed for India" statement as applying to the Google Play/Payments Center flow specifically. **Do not assume the two are interchangeable.**

### B.6 Form 43 / Form 42 / TRC — the current official Indian procedure

**[OFFICIAL]** The Income Tax Department's own brochure (March 2026) explains the current TRC regime:

> "**RULES AND FORMS FOR OBTAINING TAX RESIDENCY CERTIFICATE (TRC) BY RESIDENT TAXPAYER — Rule – 75 of Income Tax Rules, 2026 (Erstwhile Rule No. 21AB of the Income Tax Rules, 1962)** …
> **Form No. 42 (Erstwhile 10FA):** Form 42 is an **application** filed by a resident taxpayer to obtain a tax residency certificate (TRC) from the Income Tax Department. …
> **Who should file:** Any resident taxpayer who claims tax residency in India, and is **required to file a tax residency certificate to claim DTAA benefits** or fulfill requirements in other countries.
> **Frequency & Due dates:** There is **no due date** … limited to **one per tax year**.
> Process: (i) Login with PAN on Income Tax e-filing portal; (ii) Choose the tax year in which the TRC is required; (iii) Fill Form No. 42 specifying the period … **TRC is issued only tax year wise.** … Upload relevant documents: **Passport (for individuals)** or proof of stay; Certificate of incorporation/registration (for other than individuals); Any other relevant information. (iv) Verification of the form.
> **Outcome — Form No. 43 (Erstwhile 10FB):** Upon processing the application in Form No. 42, the TRC is issued by the department in **Form No. 43**.
> **Key Feature:** TRC issued by Assessing Officer would be **available on e-filing portal**. Taxpayer can easily access and download TRC from the e-filing portal."

Source: [incometaxindia.gov.in — "Form Nos. 42 & 43", Directorate of Income Tax (PR, PP & P), March 2026](https://www.incometaxindia.gov.in/documents/d/guest/2-form-no-42-43-rules-and-forms-for-obtaining-taxresidency-certificate-trc-by-resident-taxpayer-pdf) (fetch timestamp **01 May 2026**). See also the Form 43 template: [incometaxindia.gov.in — FORM 43, Certificate of Residence for the Purposes of Section 159 of the Act](https://www.incometaxindia.gov.in/documents/d/guest/fn-43). **[OFFICIAL]**

→ **This is the form an Indore developer needs to obtain in order to claim India–US treaty benefits with a US payer.** It is the **TRC for a RESIDENT** claiming benefits *abroad* — **not** Form 10F.

### B.7 Form 10F — what it is, and why it is probably NOT your form

**[OFFICIAL]** Form 10F is the **self-declaration by a NON-RESIDENT** claiming DTAA benefits on **Indian** income, furnished under **Rule 21AB** of the Income-tax Rules ([incometaxindia.gov.in — Rule 21AB](https://www.incometaxindia.gov.in/w/rule-21ab)). Its electronic-filing history, from official CBDT/DGIT(Systems) documents:

- **DGIT(Systems) Notification No. 3 of 2022 dated 16 July 2022** mandated electronic filing of Form 10F (issued under Rule 131(1)/(2)).
- **F. No. DGIT(S)-ADG(S)-3/e-Filing Notification/Forms/2023/13420, New Delhi, 28 March 2023** — "**Partial relaxation with respect to electronic submission of Form 10F by select category of taxpayers**": non-resident taxpayers **not having PAN and not required to have PAN** were exempted from mandatory electronic filing of Form 10F **till 31 March 2023**, and this relaxation was **extended further till 30 September 2023**. Such taxpayers "may make statutory compliance of filing Form 10F till 30th September 2023 in **manual form** as was being done prior to issuance of the DGIT(Systems) Notification No. 3 of 2022." Signed (Y K Singh), DGIT(Systems)-1, CBDT. Source: [incometax.gov.in — e-filing notification PDF, 28 March 2023](https://www.incometax.gov.in/iec/foportal/sites/default/files/2023-03/Refer%20Notification.pdf). **[OFFICIAL]**

> ⚠️ **[NOT VERIFIED] — post-30.09.2023 status of Form 10F.** What happened after the 30 September 2023 relaxation lapsed — i.e. whether electronic filing is now unconditionally mandatory for PAN-less non-residents, and what the current Income-tax Rules, 2026 equivalent rule/form number is — was **NOT VERIFIED** in this research.

**Direction-of-use clarification (important, because the brief conflates these):**

| Instrument | Who uses it | Purpose | Relevance to an Indore developer |
|---|---|---|---|
| **Form 10F** | **Non-resident** claiming DTAA benefit on **Indian** income | Self-declaration under Rule 21AB | **Generally NOT your form** — you are an Indian *resident*. Only relevant if you later receive Indian-source income as a non-resident. |
| **Form 42 → Form 43 (TRC)** | **Resident** claiming DTAA benefit **abroad** | Application (Form 42) and certificate (Form 43) under Rule 75, ITR 2026 | **This is your form** — to claim India–US treaty treatment from a US payer. |
| **Form 10FB** (erstwhile) | Resident | Old-form TRC certificate (ss.90/90A) | Superseded by Form 43; still shown on Google's Payments Center table. |
| **W-8BEN** | Non-US **individual** beneficial owner | Give to the US withholding agent (e.g. Google) | **This is your form** for US-side documentation. |

---

## C) Receiving the Money (FEMA / RBI)

### C.1 FIRC — what it is, and whether you need it

**[OFFICIAL-ADJACENT — FEDAI, the industry standard-setter].** FEDAI Circular **SPL-14/FIRC/2012 dated 6 February 2012** (referring to RBI guidelines extant since 1987) governs FIRC issuance:

> "In terms of extant guidelines of RBI since 1987, AD Banks may be required to issue **Certificates to beneficiaries of Inward Remittances** received through their medium for production as supporting evidence for claiming various facilities / benefits / entitlements under Exchange Control Regulations or Government Rules."
> "1) **FIRCs should be issued on security paper as per Form BCI** bearing distinctive serial / reference no.
> 2) **FIRC should be issued only in respect of** a) Advance payment for exports b) Receipt of export proceeds by an AD Bank other than the one who handles / handled GR Form/Softex/SDF/PP Forms. c) Inward remittance covering FDI/FII
> 3) All FIRCs should be signed by officers of AD Banks whose signatures are on record with Reserve Bank of India. …
> **7) a) The AD Bank that actually receives the inward remittance or reimbursement in foreign exchange should issue certificate.**
> 8) Normally, certificates should be issued only in one copy. …
> **11) The validity of FIRCs and other certificates mentioned above should be restricted to one year only.**"
> Also: "AD Banks may issue a certificate of inward remittance in **form 10H** for submission to Income Tax authorities. The form 10H is prescribed under **Section 80RRA** of Income Tax Act. The certificate should be specifically marked 'For Income Tax Purpose'."

Source: [FEDAI — SPL-14/FIRC/2012](https://fedai.org.in/DocumentUploadFiles/SPL-14-FIRC-2012.pdf). **[OFFICIAL-ADJACENT — Foreign Exchange Dealers' Association of India]**

**[OFFICIAL — RBI].** The RBI Master Direction on Export of Goods and Services confirms the electronic-FIRC reporting obligation: "AD Category – I banks need to report the **electronic FIRC to EDPMS** wherever such FIRCs are issued against inward remittances." Source: [RBI Master Direction – Export of Goods and Services (FED Master Direction No. 16/2015-16, updated as on 17 July 2026)](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF). **[OFFICIAL]**

**Do you need one?** Practically: **yes, ask your bank for an FIRC (or the modern electronic FIRC/e-FIRA advice) for each foreign ad-network credit, and retain them.** They are the standard evidence of realisation of export proceeds in convertible foreign exchange, and they are the documents that support (i) the s.2(6)(iv) "payment received in convertible foreign exchange" condition for GST export treatment, and (ii) any future scrutiny of the foreign receipts. Note the **one-year validity** in the FEDAI circular and that FIRC is issued for advance payments and export-proceeds-to-a-different-AD-bank — so for a plain inward credit to your own account, what your bank issues may be an **inward remittance advice / FIRA** rather than a security-paper FIRC. **[NON-OFFICIAL background on the FIRC-vs-BRC distinction: [Razorpay blog, "Difference Between BRC and FIRC"](https://razorpay.com/blog/difference-between-brc-and-firc/)]**

### C.2 RBI purpose codes — the brief's guesses need correction

**[OFFICIAL-ADJACENT — bank PDF reproducing RBI's list].** The RBI purpose-code list (Annexure II, "NEW PURPOSE CODES FOR REPORTING FOREX TRANSACTIONS **RECEIPT** PURPOSES") gives:

| Code | Official description (verbatim) | Group |
|---|---|---|
| **P0801** | "Hardware consultancy" | 08 Computer & Information Services |
| **P0802** | "**Software implementation/consultancy** (other than those covered in SOFTEX form)" | 08 Computer & Information Services |
| **P0803** | "Data base, data processing charges" | 08 Computer & Information Services |
| **P1006** | "**Business and management consultancy and public relations services**" | 10 Other Business Services |
| **P1007** | "**Advertising, trade fair, market research and public opinion polling services**" | 10 Other Business Services |
| **P1002** | "Trade related services - Commission on exports/imports" | 10 Other Business Services |
| **P0901** | "Franchises services - patents, copyrights, trade marks, industrial processes, franchises etc." | 09 Royalties & License Fees |
| **P0902** | "Receipts for use, through licensing arrangements, of produced originals or prototypes (such as manuscripts and films)" | 09 Royalties & License Fees |
| **P1013** | "Other services not included elsewhere" | 10 Other Business Services |
| **P0301** | (Travel group — purchases towards travel) | 03 Travel |

Source: [HSBC India — "NEW PURPOSE CODES FOR REPORTING FOREX TRANSACTIONS RECEIPT PURPOSES" (Annexure II), PDF dated 04 Oct 2021](https://www.hsbc.co.in/content/dam/hsbc/in/documents/rbi-purpose-codes-for-forex-transactions.pdf). The PDF itself states: *"The above mentioned purpose code data has been **sourced from the RBI website** of FEMA notification. If the relevant purpose is not covered in the above mentioned list, kindly refer to the Section A & B of Annexure I in the below mentioned link… https://rbidocs.rbi.org.in/rdocs/notification/PDFs/ASAP840212FL.pdf"*. **[OFFICIAL-ADJACENT — bank-hosted RBI list]**

> **CORRECTIONS to the brief's assumptions:**
> - **P0802 is NOT "telecommunications".** It is **"Software implementation/consultancy (other than those covered in SOFTEX form)"**.
> - **P1006 is NOT "software consultancy".** It is **"Business and management consultancy and public relations services"**.
> - **The advertising code is P1007 — "Advertising, trade fair, market research and public opinion polling services".** For *ad-network* revenue (you are supplying advertising services to the network), **P1007 is the semantically correct code**.
> - For *software/IT services* receipts, the RBI list points to **P0802 / P0803**, and **P1013** as a residual.

**[OFFICIAL — DGFT].** DGFT's own **self-certified eBRC generation guidelines** (Version 1.0, **10-Nov-2023**, issued alongside Trade Notice 33/2023-24 dated 10 November 2023) add a **DGFT-system-specific** constraint:

> "10. **For Services > IT, only these four purpose codes are applicable - P0802, P0803, P0807, and P0103.**
> 3. **Users cannot generate eBRC for Purpose Codes P0101 and P0108.**
> 12. In the case of Service Exports, Exporters will be able to view and attach invoices that have **SAC codes matching the description of the same services** only."

Source: [DGFT — Self-Certified eBRC Generation Guidelines v1.0](https://content.dgft.gov.in/Website/Self%20Certified%20eBRC%20Generation%20Guidelines%20v1.0.pdf). **[OFFICIAL — DGFT]**

> **Practical purpose-code guidance (my synthesis, flagged as inference):** expect your bank to ask you to pick a code. For **AdMob/AdSense/InMobi ad revenue**, **P1007 (advertising)** is the closest fit; for **app sales / in-app purchases / software licence receipts** (Apple, Google Play), expect **P0802/P0803/P0807** or **P0902** depending on how the contract is characterised. DGFT's eBRC system only accepts **P0802, P0803, P0807, P0103** for "Services > IT". **Banks differ in practice — confirm the code your AD bank wants, and keep it consistent year to year.** ⚠️ Note **P0807 did not appear in the (2021-vintage) RBI list I retrieved**, and I could **not verify its official description — [NOT VERIFIED]**.

### C.3 IEC (Import Export Code) — needed or not?

**[NOT VERIFIED — and the sources conflict.]** I could **not** retrieve a DGFT notification in this research that states in terms, "IEC is not required for export of services." What I did find:

- **[OFFICIAL-ADJACENT — ICMAI training material]** states the *opposite* of the common assumption: *"Importer Exporter Code (IEC) is mandatory for all service exporters in India, issued by the Directorate General of Foreign Trade…"* — [ICMAI PDF, 27 Nov 2025](https://icmai.in/upload/Taxation/Courses/CCIT_9_PPT_2711_2025.pdf). **[OFFICIAL-ADJACENT — professional body, and possibly outdated/overbroad]**
- **[OFFICIAL — RBI]** The RBI Master Direction on Export of Goods and Services repeatedly refers to IEC in the *goods/Bharat Mart* context ("Opening/hiring of a warehouse in 'Bharat Mart' by an Indian exporter **with a valid Importer Exporter Code**") and, for **services**, requires no declaration form at all (see C.5) — which is at least consistent with **no IEC being required for pure services export**. [RBI Master Direction](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF) **[OFFICIAL]**
- **[NON-OFFICIAL]** Advocacy that IEC is not required for service exporters, and that GST refunds for services exports do not need IEC (referencing a 2023 DGFT amendment allowing services exporters to claim GST refunds without IEC): [LegalTax — "IEC Code For Service Exporters In India: Is It Required?"](https://legaltax.in/blogs/iec-code-for-service-exporters/) **[NON-OFFICIAL]**; [Experts Panel Q&A on GST refund / BRC / IEC](https://expertspanel.in/6294/index.php?qa=2667&qa_1=gst-refund-export-of-service-officer-requires-brc-%26-iec) **[NON-OFFICIAL]**.

> **Bottom line: the widely-held position is that IEC is NOT required for export of services (including software/app/ad revenue), and that GST refund for services exports does not require IEC.** But **I could not verify the DGFT notification that supposedly says this — [NOT VERIFIED]**. Note also that **DGFT has been deactivating IECs that have not been updated** under Para 2.05(e) of FTP 2023 ([Texprocil e-newsletter](https://texprocil.org/e-newsletter/1759137522-ENews_(8.15).pdf), **[NON-OFFICIAL]**) — if you do obtain an IEC, keep it updated. **Confirm with your AD bank and CA before spending money on an IEC.**

### C.4 Bank account type, EEFC, and FEMA restrictions on a proprietorship receiving inward remittance

**[OFFICIAL — RBI].** On foreign-currency accounts, the Master Direction states:

> "**A.6 Exchange Earners' Foreign Currency Account (EEFC Account)** — (i) A **person resident in India** may open with an AD Category – I bank in India, an account in foreign currency called the Exchange Earners' Foreign Currency (EEFC) Account, in terms of … (iii) This account shall be maintained **only in the form of non-interest bearing current account**. No credit facilities, either fund-based or non-fund based, shall be permitted against the security of balances held in EEFC accounts … (iv) **All categories of foreign exchange earners are allowed to credit 100% of their foreign exchange earnings to their EEFC Accounts** subject to the condition that … b) The facility of EEFC scheme is intended to enable exchange earners **to save on conversion/transaction costs** while undertaking forex transactions. This facility is **not intended to enable exchange earners to maintain assets in foreign currency**, as India is still not fully convertible on Capital Account."

Source: [RBI Master Direction – Export of Goods and Services, para A.6](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF). **[OFFICIAL]**

→ **Key takeaway:** an **EEFC account is available to a "person resident in India" — which includes an individual sole proprietor** — and it must be a **non-interest-bearing current account**. 100% of forex earnings may be credited.

**Is a *current* account (vs savings) required?** The Master Direction does **not** say an ordinary savings account is prohibited for receiving export proceeds. But:
- **EEFC, by regulation, is a current account** (quoted above) — **[OFFICIAL]**.
- RBI/FEMA do not, in the material I read, bar a savings account from receiving an inward business remittance. ⚠️ **[NOT VERIFIED — I found no RBI rule either requiring or prohibiting a savings account for export receipts.]**
- **Practical reality:** Indian banks' KYC/onboarding policies typically require a **current account** for a proprietorship with business/export receipts, and the bank will need your **proprietorship proof** (GST certificate, MSME/Udyam registration, or a proprietor-declaration) plus the **purpose code** and a **FEMA declaration** at the time of the credit. Bank-level policy, not FEMA statute. **[NON-OFFICIAL/practical inference]**

**Is LRS relevant? [OFFICIAL-adjacent reasoning].** The **Liberalised Remittance Scheme is for OUTBOUND remittances** by residents (and restricts capital-account outflows). It does not govern *receiving* money. The Master Direction's receipt-side rules are as quoted. **LRS is therefore not applicable to inbound ad revenue.** ⚠️ I did not fetch the LRS Master Direction itself to quote it — **[NOT VERIFIED as a direct quote, though the direction of LRS is not in doubt]**.

**"FEMA restrictions on a proprietorship receiving foreign inward remittance?"** The Master Direction regulates **AD banks** and imposes the **realisation and repatriation obligation** on the exporter; it does not prohibit proprietorships from receiving foreign inward remittance. For **export of services** it says expressly (see C.5) that no declaration form is needed but the realisation/repatriation obligation still applies. **[OFFICIAL]**

### C.5 Realisation period, and the "no declaration needed for services" rule

**[OFFICIAL — RBI].** Master Direction para A.2:

> "It is obligatory on the part of the exporter to **realise and repatriate the full value of goods / software / services to India within a stipulated period** from the date of export, as under:
> (i) … the period of realization and repatriation of export proceeds shall be **nine months** from the date of export for all exporters including Units in Special Economic Zones (SEZs), Status Holder Exporters, Export Oriented Units (EOUs), Units in Electronic Hardware Technology Parks (EHTPs), Software Technology Parks (STPs) & Bio-Technology Parks (BTPs) until further notice."
> The page's footnotes record this was **substituted vide Notification No. FEMA 23(R)(7)/2025-RB dated 13 November 2025** and further **substituted vide Notification No. FEMA 23(R)(8)/2026-RB dated 05 June 2026** (which previously read "fifteen months"). A COVID-era relaxation to **fifteen months** applied to exports made **up to or on 31 July 2020** (AP DIR Series Circular 27 dated 1 April 2020).
> "(v) Third party payments for export / import transactions … b) **Third party payment should be routed through the banking channel only** … (i) AD bank should be satisfied with the bona-fides of the transaction and export documents, such as, **invoice / FIRC**."

**Para B.7 — Export of Services:**
> "It is clarified that, **in respect of export of services to which none of the Forms specified in these Regulations apply, the exporter may export such services without furnishing any declaration**, but shall be liable to **realise the amount of foreign exchange** which becomes due or accrues on account of such export, and to **repatriate the same to India** in accordance with the provisions of the Act, and these Regulations, as also other rules and regulations made under the Act."

**Para A.3(iii) — online payment gateways:**
> "Processing of export related receipts through **online payment gateways** shall be in terms of **Notification No. CO.DPSS.POLC.No.S-786/02-14-008/2023-24 dated October 31, 2023**."

Source for all three: [RBI Master Direction – Export of Goods and Services (updated as on 17 July 2026)](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF). **[OFFICIAL]**

→ **Two very useful consequences:**
1. **The FEMA realisation window for services exports is NINE MONTHS from the date of export/invoice** (per the Master Direction as updated). Rule 96A(1)(b) of the CGST Rules cross-refers to "the period as allowed under the Foreign Exchange Management Act" for the LUT/bond discharge deadline. ⚠️ **The interplay is worth flagging: Rule 96A(b) text says "one year, or the period as allowed under FEMA …, whichever is later"** — so the GST bond/LUT discharge point is **the later of one year or the FEMA period**, i.e. effectively **one year**. ([Rule 96A, OFFICIAL](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96a_v1.00.html)) — **confirm with your CA which date your LUT is keyed to.**
2. **No SOFTEX/EDF declaration is required for pure export of services** — but the **realisation and repatriation obligation still attaches**. So the compliance burden is (a) get paid through banking channels, (b) keep FIRC/advice evidence, (c) don't blow the nine-month window without an extension (AD banks can extend up to six months at a time; see para C.20).

### C.6 Payoneer / Wise / PayPal

**[OFFICIAL — RBI, indirectly].** The Master Direction does not name any provider but routes the question: "Processing of export related receipts through **online payment gateways** shall be in terms of **Notification No. CO.DPSS.POLC.No.S-786/02-14-008/2023-24 dated October 31, 2023**" ([Master Direction, para A.3(iii)](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF)). That notification is the RBI **cross-border Payment Aggregator (PA-CB)** direction — the regulatory home of Payoneer/Wise/PayPal-style inbound collection. **[OFFICIAL]**

**[OFFICIAL — RBI, URL located but content not retrievable].** RBI publishes an "**Status of Applications received from Online Payment Aggregators (PAs) and Payment Aggregators- Cross Border (PAs-CB)**" list. The current file appears to be at [website.rbi.org.in/documents/d/rbi/palist01022026-1-](https://website.rbi.org.in/documents/d/rbi/palist01022026-1-) (dated 01-02-2026 by filename).

> ⚠️ **[NOT VERIFIED] — PA-CB authorisation status of Payoneer / Wise / PayPal.** The RBI document URL redirected to the RBI homepage when fetched, so I could **not read the authorised list**. I therefore **cannot confirm from an official source whether Payoneer, Wise or PayPal India hold PA-CB authorisation**. The brief's guess that they are permitted is plausible and consistent with market practice, but I did not verify it. **[NON-OFFICIAL]** support only: a news aggregator report that **Payoneer received in-principle authorisation as a cross-border payment aggregator in India** — [MarketScreener item](https://www.marketscreener.com/news/payoneer-receives-in-principle-authorization-as-cross-border-payment-aggregator-in-india-ce7e58d2d089f426) **[NON-OFFICIAL]**. **Check RBI's PA/PA-CB list directly before relying on any of the three.**
>
> Practical consequences if you use one: (a) confirm the provider can give you an **FIRC/FIRA or inward-remittance advice** — you need it for the s.2(6)(iv) forex-receipt condition and for GST/income-tax substantiation; (b) confirm the **purpose code** reported on the credit; (c) remember that **the FEMA realisation obligation is yours, not the platform's**, and the **nine-month window** still runs from your invoice.

---

## D) Structure

### D.1 Can an individual (no company) sign publisher agreements and get paid?

**Yes.** Every network examined here operates an **individual** account type and pays individuals. Specifically:

- **Google AdMob/AdSense — [OFFICIAL].** The AdMob tax interview explicitly distinguishes **individual** from **non-individual/entity** accounts: "An **individual** account is owned and operated by an individual person and not a legal organization. **Taxes are filed in the owner's name on a personal tax return.**" Individual accounts are therefore supported and are documented with a **W-8BEN**. Source: [Google Payments Center — US tax information reporting & withholding](https://support.google.com/paymentscenter/answer/10349995?hl=en). Payment mechanics for individuals: $10 earning minimum, identity verification, PIN address verification, bank details, payment threshold (e.g. $100), payment "on or around the **21st of the month**" — [AdMob — Steps to getting paid](https://support.google.com/admob/answer/3001066?hl=en). **[OFFICIAL — Google]**
- **Apple — [OFFICIAL].** Apple's App Store Connect help states: "**All developers must complete a US tax form** to comply with the Paid Apps Agreement. … **Non-US-based** — If you're based outside the United States, the **W-8BEN, W-8BEN-E, or W-8ECI** may be required, but you'll be prompted to answer a series of questions to direct you to the most appropriate tax form and any applicable certification." Source: [Apple — Provide tax information](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/). **[OFFICIAL — Apple]**
- **InMobi — [OFFICIAL].** India publishers are explicitly addressed (GST invoice or exemption declaration; **$50 India minimum payout**) — implying direct individual/proprietorship onboarding: [InMobi Finance & Payments FAQ](https://support.inmobi.com/monetize/cat-faqs/finance-payments). **[OFFICIAL — InMobi]**
- **AppLovin, Unity, Meta Audience Network — [NOT VERIFIED].** I did **not** retrieve official publisher-payment/tax pages for AppLovin, Unity or Meta Audience Network. I therefore **cannot state** their entity-type or W-8BEN requirements. **Treat as unverified.**

**Observed entity-type constraints (what I could verify):**
- **Google Play requires the Play Console account type and the payments-profile account type to match** — there is an official help-forum thread on individual-vs-organisation mismatches ([Google Play Help thread](https://support.google.com/googleplay/android-developer/thread/307637129/should-the-play-console-account-type-be-same-as-payment-profile-account-type?hl=en)); this is community content, not policy, but it reflects a real operational constraint. **[OFFICIAL-forum / community]**
- **Apple's Developer Program** distinguishes individual from organization accounts, and switching from individual to organization is a known operational step. ⚠️ I did **not** fetch Apple's Developer Program enrolment page in this research — **[NOT VERIFIED]** as a citation.

### D.2 How Apple pays Indian developers — [OFFICIAL]

**[OFFICIAL — Apple].** Apple's App Store Connect reference, "Minimum payment threshold", lists **India with bank account currency INR at a minimum payment of USD 0.02** — i.e. **effectively no minimum payout for an Indian INR bank account** (the global default for other countries/currencies is USD 40). Source: [Apple — Minimum payment threshold](https://developer.apple.com/help/app-store-connect/reference/reporting/minimum-payment-threshold) (page timestamp **17 September 2026**). **[OFFICIAL — Apple]**

→ **Apple pays Indian developers into an INR bank account**, with no practical minimum. Contrast with Google Play (below), which pays India by **USD wire**.

**[OFFICIAL — Apple].** On **country-specific tax forms**, Apple's list of additional requirements covers **Australia, Brazil, Canada, Ireland, Mexico, Singapore, South Korea, Taiwan and Thailand** — and **India is NOT on that list**. So an India-based developer's tax-form obligation to Apple is, per Apple's own documentation, **only the US form** (W-8BEN for an individual, W-8BEN-E for an entity) plus banking information. Source: [Apple — Provide tax information](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/). **[OFFICIAL — Apple]**

> ⚠️ **[NOT VERIFIED] — Apple India entity and Indian TDS.** I did **not** verify **which Apple entity** contracts with and pays Indian developers (Apple Distribution International? Apple India Private Limited?), nor whether **any Indian TDS is deducted** on App Store proceeds to Indian developers. Apple publishes an "Apple legal entities" reference in App Store Connect — [developer.apple.com/help/app-store-connect/reference/reporting/apple-legal-entities](https://developer.apple.com/help/app-store-connect/reference/reporting/apple-legal-entities) — **which I did not fetch.** Verify this, because it determines whether your Apple receipt appears in Form 26AS **with** TDS credit (net receipt + TDS credit) or as a **gross foreign receipt with no Indian TDS** (requiring you to self-pay the whole tax). The two situations need different advance-tax planning.

### D.3 How Google Play pays Indian developers — [OFFICIAL]

**[OFFICIAL — Google].** Google Play's "Wire transfer payouts" page:

> "Developers in the locations listed below can receive payouts through **wire transfer**: … **India**, Indonesia, …"
> "**Balance requirements** — Your earned balance must meet the **minimum payout amount of US$100** to be eligible for a payout at the end of your payment cycle. … there is no maximum payout amount."
> "**Payouts currency** — Google issues wire transfer payouts in **USD**, though your financial institution may exchange these funds to your local currency to deposit the money into your bank account. … If your financial institution offers you the ability to open accounts in USD, this option is preferred."

Source: [Google Play Console Help — "Wire transfer payouts"](https://support.google.com/googleplay/android-developer/answer/2700656?hl=en). **[OFFICIAL — Google]**

→ **Google Play pays Indian developers in USD by wire transfer, minimum US$100**, with wire fees set by your bank. This is the opposite of Apple's INR payout — so a developer monetising on both stores will receive **INR from Apple** and **USD from Google Play**, which matters for FIRC/purpose-code handling (Part C.2).

### D.4 Summary comparison table

| Platform | Payer entity / currency for India | Minimum payout | Tax form required | GSTIN asked? | Source tier |
|---|---|---|---|---|---|
| **Google AdMob / AdSense** | **Google Asia Pacific Pte. Ltd.** (Singapore) for India — [OFFICIAL](https://support.google.com/admob/answer/4385995?hl=en) | **$10** earning min; typical **$100** payment threshold — [OFFICIAL](https://support.google.com/admob/answer/3001066?hl=en) | Online tax interview → **W-8BEN** (individual); AdMob TRC table names India **Form 43 / s.159** — [OFFICIAL](https://support.google.com/admob/answer/14135099?hl=en) | **No India-GST invoice requirement found** (the GST-invoice page is for **Singapore** billing addresses) | OFFICIAL (Google) |
| **Google Play (paid apps/IAP)** | Google; **USD wire** — [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/2700656?hl=en) | **US$100** — same source | PAN required; **"We do not require a tax residency certificate for India"**; Google withholds **Indian TDS under s.393(1) Table S.No. 8(v), Income-tax Act 2025** and **GST TCS u/s 52 CGST** on Indian-user sales — [OFFICIAL](https://support.google.com/paymentscenter/answer/13401799?hl=en) | **Yes — submit GSTIN if registered** ("Developers located in India that are required to obtain a registration under GST law must provide their GSTIN to Google") — same source | OFFICIAL (Google) |
| **Apple App Store** | Apple; **INR** to Indian bank account — [OFFICIAL](https://developer.apple.com/help/app-store-connect/reference/reporting/minimum-payment-threshold) | **USD 0.02** for IND/INR (**~nil**) — same source | **US form only** (W-8BEN individual / W-8BEN-E entity); **India not in Apple's country-specific list** — [OFFICIAL](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/) | **No India GST registration requested by Apple in the pages read** | OFFICIAL (Apple) |
| **InMobi** | InMobi (India/Singapore entities) | **$50 for India** publisher — [OFFICIAL](https://support.inmobi.com/monetize/cat-faqs/finance-payments) | Tax + banking details in account ("Ensure your tax and banking details are up to date") | **YES — GST invoice required from India publishers, or a GST-exemption declaration by email to bd-finance@inmobi.com** — same source | OFFICIAL (InMobi) |
| **AppLovin / Unity / Meta Audience Network** | — | — | — | — | **NOT VERIFIED** |

---

## What an Indore-based solo developer practically needs to set up

*(Checklist derived from the sourced findings above — not advice; confirm each item with your CA and bank.)*

1. **PAN** — non-negotiable. Google requires it for India developers and verifies it against the government database; it is also the **Foreign TIN** Google accepts for treaty claims. [Google Payments Center, India section](https://support.google.com/paymentscenter/answer/13401799?hl=en) **[OFFICIAL]**.
2. **Decide the GST position deliberately — do not default.** Register for GST if you want to claim input tax credit refunds, file an **LUT (Form GST RFD-11)** and invoice without IGST (s.16(3) IGST + Rule 96A), or if a network/bank asks for a GSTIN. The argument that a **sub-Rs-20-lakh pure services exporter** need not register rests on **Notification No. 10/2017-Integrated Tax dated 13.10.2017** (inter-State suppliers of taxable services up to Rs 20 lakh exempted under s.23(2) CGST) — **verify that notification on cbic.gov.in**, because I could only confirm it via a non-official reproduction. [TaxGuru reproduction](https://taxguru.in/goods-and-service-tax/gst-not-payable-on-inter-state-supplies-of-taxable-services-by-exempt-persons.html) **[NON-OFFICIAL]**; [Rule 96A](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96a_v1.00.html) **[OFFICIAL]**.
3. **If GST-registered: file the LUT for the financial year and keep the ARN.** It is the precondition for exporting services **without paying IGST**; otherwise Rule 96A requires a **bond**. Budget for **zero-rated reporting in GSTR-1 and a refund claim** for unutilised ITC.
4. **Business current account** with your AD bank, opened in the **proprietorship name**, with the business address and **proprietorship proof** (GST certificate / Udyam registration / proprietor declaration) on file. Consider an **EEFC account** if you want to hold/handle USD and save on conversion — it must be a **non-interest-bearing current account**, and **100% of forex earnings may be credited** to it. [RBI Master Direction, para A.6](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF) **[OFFICIAL]**.
5. **Purpose code discipline.** Agree the code with your bank **up front** and keep it consistent. For ad-network revenue expect **P1007 (Advertising, trade fair, market research and public opinion polling services)**; for software/IT services receipts **P0802 / P0803 / P0807**; DGFT's eBRC system only accepts **P0802, P0803, P0807, P0103** for "Services > IT". [RBI code list via HSBC Annexure II](https://www.hsbc.co.in/content/dam/hsbc/in/documents/rbi-purpose-codes-for-forex-transactions.pdf) **[OFFICIAL-ADJACENT]**; [DGFT eBRC Guidelines v1.0, 10-Nov-2023](https://content.dgft.gov.in/Website/Self%20Certified%20eBRC%20Generation%20Guidelines%20v1.0.pdf) **[OFFICIAL]**.
6. **Collect an FIRC / electronic inward-remittance advice for every foreign credit** and file them by platform and month. These are your evidence for the s.2(6)(iv) "convertible foreign exchange" condition and for any income-tax/GST scrutiny. Note FEDAI's **one-year FIRC validity** and that the certificate must be issued by the AD bank that actually received the remittance. [FEDAI SPL-14/FIRC/2012](https://fedai.org.in/DocumentUploadFiles/SPL-14-FIRC-2012.pdf) **[OFFICIAL-ADJACENT]**; [RBI Master Direction, para A.3(v) & e-FIRC/EDPMS](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF) **[OFFICIAL]**.
7. **Watch the FEMA realisation clock: nine months from the invoice/export date** to realise and repatriate proceeds (per the RBI Master Direction as updated). If a network is slow, ask your AD bank for an **extension** (AD banks may grant up to six months at a time, para C.20). [RBI Master Direction, para A.2](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF) **[OFFICIAL]**. Remember **no SOFTEX/EDF declaration is needed for pure services exports** (para B.7) — **but the realisation obligation still applies**.
8. **Complete the tax interview on each platform and file a W-8BEN as an individual** — never W-8BEN-E, which is for entities. [IRS W-8BEN instructions (10/2021)](https://www.irs.gov/instructions/iw8ben) **[OFFICIAL]**. On **line 10**, claim treaty benefits on **business profits not attributable to a permanent establishment**, citing the **India–US treaty business-profits article** — because **Google classifies AdSense/AdMob income as "Services or other business income", not as a royalty**. [Google Payments Center](https://support.google.com/paymentscenter/answer/10349995?hl=en) **[OFFICIAL]**; [IRS W-8BEN instructions](https://www.irs.gov/instructions/iw8ben) **[OFFICIAL]**. **Diarise the 3-year W-8 refresh** that Google applies.
9. **Obtain the Indian TRC — Form 42 application → Form 43 certificate — from the income-tax e-filing portal**, per tax year, uploading your **passport**. This is the "TRC" for a **resident** claiming treaty benefits abroad, and Google's AdMob table names India as *"Certificate of Residence for the Purposes of Section 159 in Form 43"*. [incometaxindia.gov.in — Form Nos. 42 & 43, March 2026](https://www.incometaxindia.gov.in/documents/d/guest/2-form-no-42-43-rules-and-forms-for-obtaining-taxresidency-certificate-trc-by-resident-taxpayer-pdf) **[OFFICIAL]**; [AdMob non-US tax info](https://support.google.com/admob/answer/14135099?hl=en) **[OFFICIAL]**. *Do not confuse this with **Form 10F**, which is a **non-resident's** self-declaration for **Indian** income — generally not your form.*
10. **Choose and document your presumptive-taxation position each year.** If your activity is treated as a **business**, **s.44AD** gives **6% deemed profit** (digital receipts) on turnover up to **Rs 2 crore / Rs 3 crore** — and you are **exempt from tax audit u/s 44AB**. If it is treated as a **profession (technical consultancy)**, **s.44ADA** gives **50% deemed profit** up to **Rs 50 lakh / Rs 75 lakh**, and **s.44AD is expressly unavailable**. [incometaxindia — Small Businessmen page](https://www.incometaxindia.gov.in/w/small-businessmen-benefits-allowable) **[OFFICIAL]**; [incometaxindia — s.44AD eligibility FAQ](https://www.incometaxindia.gov.in/w/which-businesses-are-not-eligible-for-presumptive-taxation-scheme-of-section-44ad-) **[OFFICIAL]**. **Get this characterisation documented with your CA — it is the biggest single number in your tax bill.**
11. **Pay advance tax — nobody will withhold it for you.** No foreign ad network deducts Indian TDS, so there will be **no TDS credit in your 26AS/AIS** for this income. As a 44AD/44ADA opter you may pay the **whole** advance tax in **one instalment by 15 March**, and are liable only if the liability is **Rs 10,000 or more**. [incometaxindia — Small Businessmen page, Section E](https://www.incometaxindia.gov.in/w/small-businessmen-benefits-allowable) **[OFFICIAL]**. **Do not confuse this with Google Play India's withholding** on Indian-user paid-app/IAP sales (s.393(1) Table S.No. 8(v), Income-tax Act 2025), which **will** appear as TDS — [Google Payments Center](https://support.google.com/paymentscenter/answer/13401799?hl=en) **[OFFICIAL]**.
12. **Give InMobi what InMobi asks for.** InMobi requires **either a GST invoice or a written GST-exemption declaration** (email bd-finance@inmobi.com) from India publishers — this is the one network in the brief with an explicit, verified India GST demand. [InMobi Finance & Payments FAQ](https://support.inmobi.com/monetize/cat-faqs/finance-payments) **[OFFICIAL]**.
13. **Register the proprietorship and keep it documented** (Udyam/MSME registration is free and is commonly accepted as proprietorship proof for bank onboarding). ⚠️ **[NOT VERIFIED]** as a hard requirement — but it materially eases KYC.
14. **Ask your bank about Payoneer/Wise/PayPal before adopting one.** Confirm the provider holds RBI **PA-CB** authorisation and can issue an **FIRC/FIRA** with a **purpose code**. I could **not** verify the RBI PA-CB list or any of the three providers' authorisation status — **[NOT VERIFIED]**. [RBI PA/PA-CB status list (URL located, content not readable)](https://website.rbi.org.in/documents/d/rbi/palist01022026-1-); [RBI Master Direction routing online-gateway receipts to the 31 Oct 2023 PA-CB notification](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF) **[OFFICIAL]**.

---

## Explicit "could not verify" register

| # | Item | Status |
|---|---|---|
| 1 | **CBIC-hosted original of Notification No. 10/2017-Integrated Tax dated 13.10.2017** (services registration exemption below Rs 20 lakh) — full text obtained only from a non-official reproduction, corroborated on number/date/subject by an ICMAI compilation | **NOT VERIFIED (official original)** |
| 2 | **Notification No. 37/2017-Integrated Tax dated 04.10.2017** — LUT conditions (Rs 5 crore turnover ceiling, exclusions) | **NOT VERIFIED** |
| 3 | Any **official CBIC circular/FAQ** expressly confirming that a sub-Rs-20-lakh *pure services exporter* needs no GST registration | **NOT VERIFIED** |
| 4 | **IGST reverse-charge notification** for imported services and any *de minimis* exemption; RCM registration exposure on foreign SaaS/developer-program fees | **NOT VERIFIED** |
| 5 | **"Bill to Ship To"** application to ad-network export of services | **NOT VERIFIED / likely not applicable** |
| 6 | **Section 13 IGST place-of-supply text** for B2B services (default rule) | **NOT VERIFIED by direct fetch** |
| 7 | **Rule 115** (or successor) forex-conversion rule and the receipt-date election | **NOT VERIFIED by direct fetch** |
| 8 | **s.44AD(4)/(5) five-year lock-in** proviso text | **NOT VERIFIED** |
| 9 | Whether **app development is a s.44AA(1) "technical consultancy" profession** — no official CBDT/profession-list resolution located | **NOT VERIFIED** |
| 10 | Mapping of old section numbers to the **Income-tax Act, 2025** (e.g. 44AD/44ADA, 195, 207–211) | **NOT VERIFIED** |
| 11 | **India–US DTAA Article 7 / Article 12 treaty text**; the exact royalty tier (10% vs 15%) and the rate Google applies to "Services or other business income" | **NOT VERIFIED (only the Embassy of India 10%/15% headline table verified)** |
| 12 | Whether an Indian resident's effective **US withholding on AdMob** is 0% (no US PE) | **NOT VERIFIED — legal conclusion not tested** |
| 13 | Post-30.09.2023 mandatory status of **electronic Form 10F**; its Income-tax Rules, 2026 equivalent | **NOT VERIFIED** |
| 14 | **RBI PA / PA-CB authorised list** contents; authorisation status of **Payoneer, Wise, PayPal India** | **NOT VERIFIED** |
| 15 | **P0807** official description (absent from the 2021-vintage RBI list retrieved; appears only in DGFT's eBRC guideline) | **NOT VERIFIED** |
| 16 | **DGFT notification** stating IEC is not required for services exports / 2023 change allowing services exporters GST refund without IEC | **NOT VERIFIED** |
| 17 | Whether a **savings account** is legally barred (vs. bank policy) for receiving business/export remittances | **NOT VERIFIED** |
| 18 | **Apple India paying entity** (which Apple legal entity pays Indian developers) and whether **Indian TDS** is deducted on Apple proceeds | **NOT VERIFIED** |
| 19 | **AppLovin, Unity, Meta Audience Network** publisher entity-type, tax-form and India GSTIN requirements | **NOT VERIFIED** |
| 20 | **Apple Developer Program** individual vs organization enrolment specifics | **NOT VERIFIED** |

---

*Prepared as a research deliverable. Every factual claim above is attributed; contested or unverified points are flagged inline and consolidated in the register above. This is not tax, legal or accounting advice.*
