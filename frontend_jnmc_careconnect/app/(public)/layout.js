import Navbar from "../layout/Navbar";
import Footer from "../layout/footer";

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
