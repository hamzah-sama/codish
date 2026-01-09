import { LayoutNavbar } from "./components/navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="w-full">
      <LayoutNavbar />
      <div className="flex h-screen">
        <main className="flex-1 pt-16 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
