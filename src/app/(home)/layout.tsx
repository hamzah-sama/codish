import { HomeNavbar } from "@/modules/home/home-navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="w-full">
      <HomeNavbar />
      <div className="flex h-screen">
        <main className="flex-1 pt-12 overflow-y-auto bg-sidebar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
