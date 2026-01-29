import * as React from "react";

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;

export type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
}

export function useDeviceType(): DeviceInfo {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(() => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < MOBILE_BREAKPOINT) return "mobile";
    if (width < TABLET_BREAKPOINT) return "tablet";
    return "desktop";
  });

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      let newType: DeviceType;
      
      if (width < MOBILE_BREAKPOINT) {
        newType = "mobile";
      } else if (width < TABLET_BREAKPOINT) {
        newType = "tablet";
      } else {
        newType = "desktop";
      }
      
      setDeviceType(newType);
    };

    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", updateDeviceType);
    updateDeviceType();

    return () => mql.removeEventListener("change", updateDeviceType);
  }, []);

  return {
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    deviceType,
  };
}
