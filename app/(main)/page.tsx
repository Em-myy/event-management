import Link from "next/link";

const MainPage = () => {
  return (
    <div>
      <h1>ESRMS</h1>
      <h2>Manage Events Without the Chaos</h2>
      <h3>
        If you do not have an account{" "}
        <span>
          <Link href="sign-up">Sign Up</Link>
        </span>
        , or if you have an account{" "}
        <span>
          <Link href="sign-in">Sign In</Link>
        </span>
      </h3>
    </div>
  );
};

export default MainPage;
