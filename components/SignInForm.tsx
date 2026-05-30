"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type formType = {
  email: string;
  password: string;
};

const SignInForm = () => {
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      console.log(error.message);
      return;
    }
    router.push("/dashboard");

    router.refresh();
  };
  return (
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
  );
};

export default SignInForm;
