"use client";

import GoogleButton from "@/components/GoogleButton";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import { useState } from "react";

const SignInPage = () => {
  const [authSelect, setAuthSelect] = useState<string>("Sign In");

  const handleSignInAuth = () => {
    setAuthSelect("Sign In");
  };

  const handleSignUpAuth = () => {
    setAuthSelect("Sign Up");
  };
  return (
    <main className="grid grid-cols-2">
      <section className="bg-blue-800">
        <h2>Manage Events without choas</h2>
      </section>
      <section className="bg-gray-300">
        <div>
          <button onClick={handleSignInAuth}>Sign In</button>
          <button onClick={handleSignUpAuth}>Sign Up</button>
        </div>
        <div>{authSelect === "Sign In" ? <SignInForm /> : <SignUpForm />}</div>
        <h2>Or</h2>
        <div>
          <GoogleButton />
        </div>
      </section>
    </main>
  );
};

export default SignInPage;
