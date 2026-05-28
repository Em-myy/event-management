import Link from "next/link";
import LogoutButton from "./LogoutButton";

const NavBar = () => {
  return (
    <>
      <main>
        <h1>ESRMS</h1>
        <hr />
        <div>
          <h3>Navigation</h3>
          <nav className="flex flex-col">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/my-bookings">My Bookings</Link>
            <Link href="/new-booking">New Booking</Link>
            <Link href="/approvals">Approvals</Link>
            <Link href="/admin-panel">Admin Panel</Link>
          </nav>
        </div>
        <hr />
        <div>
          <h2>Dr Jane</h2>
          <LogoutButton />
        </div>
      </main>
    </>
  );
};

export default NavBar;
