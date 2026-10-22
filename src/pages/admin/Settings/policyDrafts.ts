import type { PolicyType } from '@/types/settings';

export const POLICY_DRAFTS: Partial<Record<PolicyType, { title: string; content: string }>> = {
  TERMS: {
    title: 'JDM Experience — Terms and Conditions',
    content: `
      <p><strong>Last Updated:</strong> [Operator to insert approved effective date]</p>
      <p><strong>Draft for operator and legal review.</strong> Complete all bracketed items and confirm that this text matches the operating entity and current service before publishing.</p>
      <h2>1. Introduction</h2>
      <p>These Terms and Conditions govern use of the JDM Experience website and its tour reservation services. Submitting a reservation means that the customer agrees to the Terms version identified at checkout. Nothing in these Terms limits rights that cannot lawfully be limited.</p>
      <h2>2. Reservations and Booking</h2>
      <p>Customers may browse available tours, select a reservation date, choose a number of seats, and submit a reservation. Reservations are subject to availability and the service's confirmation process. Submitting a reservation does not itself confirm the booking. Customers are responsible for the accuracy of their name, email address, phone number, selected date, and seat quantity.</p>
      <h2>3. Tour Availability and Date Holds</h2>
      <p>Only tours marked Available can be booked. A selected tour date may be held temporarily while checkout is completed. A hold may expire if checkout is abandoned or its time limit is reached. The same tour and date cannot be booked while an active reservation or hold prevents it.</p>
      <h2>4. Booking Cutoff</h2>
      <p>Same-day reservations are subject to the booking cutoff configured on the website (currently 5:00 PM Japan Standard Time by default). The website may reject a reservation after the applicable cutoff. This cutoff does not mean that every future date is unavailable after 5:00 PM.</p>
      <h2>5. Payment and Verification</h2>
      <p>Customers must select an available payment method and follow the instructions displayed at checkout. Payment proof is required for the current checkout flow and must be accurate and readable. Submitting proof does not confirm a reservation. The reservation may remain pending while authorized personnel review the payment and update its status.</p>
      <h2>6. Cancellations</h2>
      <p>A customer with a paid reservation may submit a cancellation request more than 24 hours before the scheduled reservation date. Requests made at or within 24 hours are not eligible through the current request flow. Submitting a request does not cancel the reservation or guarantee approval. Certain pending and unpaid reservations may be cancellable through the website where that option is available.</p>
      <h2>7. Refunds</h2>
      <p>Refund requests are subject to review and approval. The customer may be asked to provide refund destination details. An approved refund is processed through the refund method recorded for the request; submission or approval alone does not mean the refund has been completed. The customer can follow the reservation status and notifications for updates.</p>
      <h2>8. Customer Responsibilities</h2>
      <ul>
        <li>Provide accurate reservation information and truthful payment proof.</li>
        <li>Keep account credentials secure and use the website lawfully.</li>
        <li>Avoid fraudulent bookings and unauthorized access.</li>
        <li>Follow applicable instructions communicated for the tour.</li>
      </ul>
      <h2>9. Reviews</h2>
      <p>Customers may submit reviews when eligible under the website's review rules. Reviews must not contain unlawful, fraudulent, or misleading content.</p>
      <h2>10. Website Availability and Changes</h2>
      <p>The website may be unavailable because of maintenance, technical issues, or circumstances beyond the operator's reasonable control. Material changes affecting existing reservations should be communicated where appropriate.</p>
      <h2>11. Personal Information</h2>
      <p>Personal information is handled as described in the <a href="/privacy-policy">Privacy Policy</a> and under applicable privacy laws.</p>
      <h2>12. Operator and Contact Details</h2>
      <p>Operating entity: [Operator to provide legal name]</p>
      <p>Official email: [Operator to provide verified email]</p>
      <p>Contact page: [Operator to confirm public contact URL]</p>
      <h2>13. Updates</h2>
      <p>The current Terms version and effective date will be shown with this document. A material change may require customers to review and agree to a new version before making another reservation.</p>
      <h2>14. Governing Law</h2>
      <p>[Operator and qualified counsel to confirm the governing law and dispute terms based on the operating entity, business arrangements, and applicable law. Do not assume Japanese law governs every aspect solely because tours operate in Japan.]</p>
    `,
  },
  PRIVACY: {
    title: 'JDM Experience — Privacy Policy',
    content: `
      <p><strong>Last Updated:</strong> [Operator to insert approved effective date]</p>
      <p><strong>Draft for operator and legal review.</strong> Complete bracketed details and verify providers, locations, transfer arrangements, and legal bases before publication. This draft is prepared with reference to Japan's Act on the Protection of Personal Information (APPI), related rules, and Personal Information Protection Commission (PPC) guidance, where applicable; publication alone does not establish legal compliance.</p>
      <h2>1. Introduction and Operator</h2>
      <p>This policy describes personal information handled through the JDM Experience website, why it is used, and how customers may make applicable requests. JDM Experience is a service name; the actual operator and responsible contact must be identified here: [Operator to provide legal entity or responsible business name, address, and privacy contact].</p>
      <h2>2. Personal Information Handled</h2>
      <p>Depending on website use, the service may handle:</p>
      <ul>
        <li><strong>Account and authentication:</strong> name and email address, local account identifier, and authentication identifiers returned to the application by Auth0 where configured.</li>
        <li><strong>Reservations:</strong> name, email, phone number, selected tour and date, seat quantity, special requests, reservation/cancellation status, and booking history.</li>
        <li><strong>Payment administration:</strong> selected payment method, uploaded payment proof, payment review status, and refund request or processing details.</li>
        <li><strong>Customer activity:</strong> eligible reviews, wishlists, and messages sent through the website.</li>
        <li><strong>Technical and security information:</strong> only information actually collected by the deployed application and its providers. The operator must verify logging and cookie behavior before adding specifics.</li>
      </ul>
      <p>Customers should upload only the information needed to verify payment and should avoid including unrelated personal information.</p>
      <h2>3. Purposes of Use</h2>
      <p>Information may be used as necessary to create and manage accounts; process reservations; check availability and prevent conflicting bookings; review payment submissions; confirm, update, or cancel reservations; process eligible refund requests; send booking-related notifications; respond to inquiries; administer eligible reviews and wishlists; protect the service; and meet applicable legal obligations. Information will not be used outside disclosed purposes unless permitted by applicable law.</p>
      <h2>4. Applicable Legal Basis and Consent</h2>
      <p>The operator must determine and document the applicable legal basis for each processing activity under the law applicable to the operator and customer. Consent is not necessarily the legal basis for every activity. The checkout Privacy Policy checkbox records acknowledgment that the notice was presented; it is not blanket consent to all processing. Where specific processing requires consent, the operator must identify that processing, obtain appropriate informed consent, and record it separately. Withdrawal and its consequences must be handled as required by applicable law.</p>
      <h2>5. Payment Proof</h2>
      <p>Authorized personnel may review uploaded payment proof to verify a transaction and administer the related reservation. Access should be limited to personnel who need it for their work. Customers should not include unrelated personal data in a receipt or screenshot.</p>
      <h2>6. Disclosure and Service Providers</h2>
      <p>Authorized personnel and service providers may handle information as necessary to operate the service. The current codebase uses Auth0 for authentication where configured, Supabase for the Postgres database and file storage, and Vercel for deployment. Email delivery depends on the provider configured in the deployment. The operator must verify the actual providers, their roles, contractual safeguards, and data locations before publishing this policy. Information is not represented as never being shared.</p>
      <h2>7. International Transfers</h2>
      <p>Provider regions, access locations, and international transfer arrangements have not been confirmed from the application code. The operator must verify the Auth0 tenant, Supabase database and storage regions, Vercel deployment and logs, email provider, and any other recipient. If personal data is provided to a third party in a foreign country, the operator must determine whether APPI international-transfer requirements apply and provide required information or obtain an appropriate transfer mechanism before the transfer. Do not rely on this draft as authorization for a transfer.</p>
      <h2>8. Retention</h2>
      <p>Information should be retained only as long as necessary for disclosed purposes and applicable legal obligations. The operator must approve actual retention and deletion periods; none are specified by this draft.</p>
      <ul>
        <li>Account data: [Operator to specify]</li>
        <li>Reservation data: [Operator to specify]</li>
        <li>Payment proof: [Operator to specify]</li>
        <li>Consent and policy-version records: [Operator to specify]</li>
      </ul>
      <h2>9. Security</h2>
      <p>The operator should maintain safeguards appropriate to the information and risks, including limiting access according to role and business need. Specific technical controls, encryption, certifications, and audit practices must be verified before being described as implemented.</p>
      <h2>10. Customer Requests and Rights</h2>
      <p>Subject to applicable law, statutory conditions, identity verification, and exceptions, customers may request disclosure, correction, addition, deletion, cessation of use, or cessation of third-party provision of their personal information. Some records may need to be retained to meet legal obligations or resolve claims. Requests should be sent using the contact procedure below; the operator must add the verification and response procedure before publication.</p>
      <h2>11. Privacy Inquiries</h2>
      <p>Responsible person or role: [Operator to provide]</p>
      <p>Privacy request email: [Operator to provide verified email]</p>
      <p>Business address, if applicable: [Operator to provide]</p>
      <h2>12. Cookies and Authentication</h2>
      <p>The application uses Auth0 for authentication where configured. The operator must confirm the actual Auth0 and browser session technologies, their purposes, and relevant provider privacy materials before describing specific cookies. No analytics or advertising use is asserted by this draft.</p>
      <h2>13. Children</h2>
      <p>The operator must confirm whether tours are available to minors and document the actual age restrictions and booking procedure. This draft does not establish an age limit or assume parental consent is always required.</p>
      <h2>14. Policy Updates</h2>
      <p>The current version and effective date are shown with this document. Material changes should be communicated where appropriate. If a change requires renewed agreement or consent, the applicable process must be followed before the affected processing continues.</p>
      <h2>15. PPC Information</h2>
      <p>Japan's Personal Information Protection Commission provides official information at <a href="https://www.ppc.go.jp/en/legal/" target="_blank" rel="noopener noreferrer">https://www.ppc.go.jp/en/legal/</a>.</p>
    `,
  },
};
