import BookingWizard from '@/components/BookingWizard';

export const metadata = { title: 'New Booking — ESRMS' };

export default function NewBookingPage() {
  return (
    <div className="animate-fade-in w-full">
      <div className="page-header mb-6 sm:mb-8 flex flex-col gap-1 sm:gap-2">
        <h1 className="page-title text-2xl sm:text-3xl md:text-4xl break-words">
          New Booking Request
        </h1>
        <p className="page-subtitle text-sm sm:text-base break-words">
          Complete all steps to submit your event for approval
        </p>
      </div>

      <BookingWizard />
    </div>
  );
}