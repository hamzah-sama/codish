import { HomeNavbar } from "@/modules/home/home-navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="flex h-screen flex-col">
      <HomeNavbar />

      <main className="flex-1 bg-sidebar min-h-0">{children}</main>
    </div>
  );
};

export default Layout;
