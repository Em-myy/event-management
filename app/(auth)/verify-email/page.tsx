const VerifyEmail = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Check your mail
        </h2>
        <p className="text-gray-600 mb-6">
          We just sent a confirmation link to your mail. Please click on it to
          activate your account
        </p>
        <p className="text-sm text-gray-500">You can close this tab safely</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
