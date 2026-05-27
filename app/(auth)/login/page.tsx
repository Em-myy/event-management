"use client";

import GoogleButton from "@/components/GoogleButton";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type formType = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleFormChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFormSubmit = async (
    event: React.ChangeEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        console.log(error.message);
      }
      router.push("/");

      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <main>
      <h1>Login Page</h1>
      <section>
        <div>
          <form onSubmit={handleFormSubmit}>
            <div>
              <label>E-Mail: </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                required
                onChange={handleFormChange}
                className="bg-green-300"
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                required
                onChange={handleFormChange}
                className="bg-blue-400"
              />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
        <h2>Or</h2>
        <div>
          <GoogleButton />
        </div>
      </section>
      <div>
        <p>If you don't have an account then: </p>
        <Link href="/register">Register</Link>
      </div>
    </main>
  );
};

export default LoginPage;
