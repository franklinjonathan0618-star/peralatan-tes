
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard"
  },
  {
    title: "Laporan Alat",
    items: [
      {
        title: "Data Alat Berat",
        href: "/data-alat-berat",
      },
      {
        title: "Data Alat Pendukung",
        href: "/data-alat-pendukung",
      },
      {
        title: "Sewa Alat Eksternal",
        href: "/sewa-alat-eksternal",
      },
      {
        title: "RPA",
        href: "/rpa",
      },
    ],
  },
  {
    title: "Laporan Perbaikan",
    items: [
      {
        title: "Kegiatan Mekanik",
        href: "/laporan/kegiatan-mekanik",
      },
      {
        title: "Stock Sparepart",
        href: "/stock-sparepart",
      },
      {
        title: "PPA",
        href: "/ppa",
      },
      {
        title: "Form Perbaikan",
        href: "/form-perbaikan",
      },
    ],
  },
  {
    title: "Laporan Bulanan",
    items: [
      {
        title: "Stock BBM",
        href: "/stock-bbm",
      },
      {
        title: "Stock Oli",
        href: "/stock-oli",
      },
      {
        title: "Time Sheet",
        href: "/time-sheet",
      },
    ],
  },
];

export function MainNav() {
  const location = useLocation();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {menuItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            {item.items ? (
              <>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {item.items.map((subItem) => (
                      <li key={subItem.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={subItem.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              location.pathname === subItem.href
                                ? "bg-accent text-accent-foreground"
                                : ""
                            )}
                          >
                            <div className="text-sm font-medium leading-none">
                              {subItem.title}
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <Link
                to={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : ""
                )}
              >
                {item.title}
              </Link>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
