import BookingWizard from '@/components/BookingWizard';

export const metadata = { title: 'New Booking — ESRMS' };

export default function NewBookingPage() {
  return (
    <div className="animate-fade-in">
      {/* Added responsive bottom margin (smaller on mobile, larger on desktop) */}
      <div className="page-header mb-6 sm:mb-8">
        <h1 className="page-title">New Booking Request</h1>
        <p className="page-subtitle">Complete all steps to submit your event for approval</p>
      </div>
      
      {/* The actual responsive heavy-lifting will happen inside this component */}
      <BookingWizard />
    </div>
  );
}