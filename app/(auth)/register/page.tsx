"use client";

import GoogleButton from "@/components/GoogleButton";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type formType = {
  username: string;
  email: string;
  password: string;
};

const RegisterPage = () => {
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState<formType>({
    username: "",
    email: "",
    password: "",
  });

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFormSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/profile`,
        data: {
          username: formData.username,
        },
      },
    });

    if (error) {
      console.error("Sign up error: ", error.message);
      return;
    }

    if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      console.log("An account with this mail exists, please use another mail");
      return;
    }

    router.push("/verify-email");
  };
  return (
    <>
      <main>
        <h1>SIGN UP PAGE</h1>
        <section>
          <div>
            <form onSubmit={handleFormSubmit}>
              <div className="flex flex-col gap-y-2">
                <div>
                  <label>Username: </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    required
                    className="bg-amber-300"
                  />
                </div>
                <div>
                  <label>E-Mail: </label>
                  <input
                    type="email"
                    placeholder="xyz@gmail.com"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="bg-amber-300"
                  />
                </div>
                <div>
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="....."
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                    className="bg-blue-400"
                  />
                </div>
              </div>
              <button type="submit">Sign Up</button>
            </form>
          </div>
          <h2>Or</h2>
          <div>
            <GoogleButton />
          </div>
        </section>
        <div>
          <p>If you have an account: </p>
          <Link href="/login">Login</Link>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;
