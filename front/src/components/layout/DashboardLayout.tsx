import { useIsMobile } from "../../hooks/useMediaQuery";
import { DesktopLayout } from "./desktop/DesktopLayout";
import { MobileLayout } from "./mobile/MobileLayout";

export const DashboardLayout = () => {
  const isMobile = useIsMobile();

  // Renderiza el layout correspondiente
  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};
