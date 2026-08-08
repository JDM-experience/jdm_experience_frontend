import { Typography } from 'antd';

const SECTIONS: { title: string; bullets: string[]; note?: string }[] = [
  {
    title: 'Customer Conduct Policy',
    bullets: [
      'Customers must treat our drivers, staff, and vehicles with respect.',
      'Smoking, illegal substances, and unlawful behavior inside our vehicles are strictly prohibited.',
      'Any damage caused by a customer may result in additional charges.',
    ],
  },
  {
    title: 'Booking Policy',
    bullets: [
      'Reservations are accepted on a first-come, first-served basis.',
      'A booking is confirmed only after successful payment.',
      'Same-day bookings are accepted only before 5:00 PM Japan Standard Time (JST).',
      'Bookings made after the daily cutoff must be scheduled for another available date.',
    ],
  },
  {
    title: 'Website Terms & Privacy',
    bullets: [
      'By using this website, you agree to our terms and policies.',
      'Your personal information is collected only to process bookings and provide customer support.',
      'We do not sell or share your personal information with unauthorized third parties.',
    ],
    note: 'Cookies may be used to improve your browsing experience. You can manage or disable cookies through your browser settings.',
  },
  {
    title: 'Cancellation & Refund Policy',
    bullets: [
      'Cancellation requests should be made as early as possible.',
      'Refund eligibility depends on the cancellation circumstances and our refund policy.',
      'No-shows may not be eligible for a refund.',
    ],
    note: 'Approved refunds will be processed using the original payment method whenever possible.',
  },
];

export default function Policy() {
  return (
    <>
      <div style={{ background: '#111', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <Typography.Title level={2} style={{ color: '#fff' }}>
          Store & Website Policies
        </Typography.Title>
        <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>
          Learn about our company, bookings, and website policies below.
        </Typography.Text>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <Typography.Title level={4}>{section.title}</Typography.Title>
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            {section.note && <Typography.Paragraph type="secondary">{section.note}</Typography.Paragraph>}
          </div>
        ))}
      </div>
    </>
  );
}
