import HomeLayout from "@/modules/layout";

interface Props {
  children: React.ReactNode;
}
const Layout = ({ children }: Props) => {
  return <HomeLayout>{children}</HomeLayout>;
};

export default Layout;