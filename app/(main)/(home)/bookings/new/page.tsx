import BookingWizard from '@/components/BookingWizard';
export const metadata = { title: 'New Booking — ESRMS' };

export default function NewBookingPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">New Booking Request</h1>
        <p className="page-subtitle">Complete all steps to submit your event for approval</p>
      </div>
      <BookingWizard />
    </div>
  );
}