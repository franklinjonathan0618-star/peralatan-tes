import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Menu, X, LogOut, ChevronDown, ChevronUp, User, Users, Shield, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useCurrentUserViewPermissions } from '@/hooks/useCurrentUserPermissions';

interface SubMenuItem {
  title: string;
  path: string;
}

interface MenuItem {
  title: string;
  path?: string;
  adminOnly?: boolean;
  items?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard' },
  {
    title: 'Laporan Alat',
    items: [
      { title: 'Data Alat Berat', path: '/data-alat-berat' },
      { title: 'Data Alat Pendukung', path: '/data-alat-pendukung' },
      { title: 'Sewa Alat', path: '/sewa-alat-eksternal' },
      { title: 'RPA', path: '/rpa' },
      { title: 'Riwayat Penggunaan Alat', path: '/riwayat-penggunaan-alat' },
      { title: 'Persetujuan Pemutihan Alat', path: '/pemutihan-alat' },
      { title: 'Data Pemutihan Alat', path: '/pemutihan' },
    ]
  },
  {
    title: 'Laporan Perbaikan',
    items: [
      { title: 'Kegiatan Mekanik', path: '/laporan/kegiatan-mekanik' },
      { title: 'PPA', path: '/ppa' },
      { title: 'Form Perbaikan', path: '/form-perbaikan' },
    ]
  },
  {
    title: 'Laporan Bulanan',
    items: [
      { title: 'Stock BBM', path: '/stock-bbm' },
      { title: 'Stock Oli', path: '/stock-oli' },
      { title: 'Stock Sparepart', path: '/stock-sparepart' },
      { title: 'Time Sheet', path: '/time-sheet' },
    ]
  },
  {
    title: 'System',
    adminOnly: true,
    items: [
      { title: 'Project Baru', path: '/system/project-baru' },
      { title: 'Manajemen User', path: '/system/manajemen-user' },
      { title: 'Manajemen Akses User', path: '/system/manajemen-akses-user' },
      { title: 'Audit Log', path: '/system/audit-log' },
      { title: 'Login History', path: '/system/login-history' },
    ]
  },
];

// Map a menu path to a pageKey used in the permissions database
function pathToPageKey(path: string): string {
  // Special mappings
  const map: Record<string, string> = {
    '/data-alat-berat': 'dataAlatBerat',
    '/data-alat-pendukung': 'dataAlatPendukung',
    '/sewa-alat-eksternal': 'sewaAlatEksternal',
    '/rpa': 'rpa',
    '/riwayat-penggunaan-alat': 'riwayatPenggunaanAlat',
    '/pemutihan': 'pemutihan',
    '/pemutihan-alat': 'pemutihanAlat',
    '/laporan/kegiatan-mekanik': 'kegiatanMekanik',
    '/stock-sparepart': 'stockSparepart',
    '/ppa': 'ppa',
    '/form-perbaikan': 'formPerbaikan',
    '/stock-bbm': 'stockBBM',
    '/stock-oli': 'stockOli',
    '/time-sheet': 'timeSheet',
    '/dashboard': 'dashboard',
    '/system/project-baru': 'system',
    '/system/manajemen-user': 'system',
    '/system/manajemen-akses-user': 'system',
    '/system/audit-log': 'system',
    '/system/login-history': 'system',
  };
  return map[path] || path.replace(/\//g, '').replace(/-/g, '').toLowerCase();
}

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeProject, setActiveProject] = useState<{ namaProject: string; cabang: string } | null>(null);

  // Track activity on route change
  useActivityTracker();

  // Fetch per-user view permissions from database
  const { viewMap } = useCurrentUserViewPermissions();

  // User stats (total & online) - only for admin
  const [userStats, setUserStats] = useState<{ total: number; online: number } | null>(null);
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!authUser) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/system/user-stats`);
        const json = await res.json();
        if (json.data) setUserStats(json.data);
      } catch { /* non-critical */ }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [authUser]);

  // Load active project from localStorage
  useEffect(() => {
    const savedProject = localStorage.getItem('activeProject');
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setActiveProject(project);
      } catch {
        console.error('Failed to parse active project');
      }
    }
  }, []);

  // Map authUser ke format yang dipakai NavBar
  const user = authUser ? {
    id: authUser.id,
    username: authUser.username,
    email: authUser.email || '',
    full_name: authUser.name,
    role: authUser.role,
  } : null;

  // Check if a page path is accessible based on database permissions
  const isPathAccessible = (path: string): boolean => {
    if (!user) return false;
    // Admin always sees everything
    if (user.role === 'admin') return true;
    // Check database permissions (viewMap)
    const pageKey = pathToPageKey(path);
    // If viewMap is empty (still loading or no custom perms), use ROLE_PERMISSIONS fallback
    if (Object.keys(viewMap).length === 0) return false;
    return viewMap[pageKey] === true;
  };

  // Filter menu items berdasarkan database permissions
  const getAccessibleMenuItems = (): MenuItem[] => {
    if (!user) return [];

    const result: MenuItem[] = [];

    for (const item of menuItems) {
      if (item.items) {
        // For System menu (adminOnly), check 'system' page permission
        if ((item as any).adminOnly) {
          // Show system menu if user is admin OR if user has can_view for 'system'
          const hasSystemAccess = user.role === 'admin' ||
            (Object.keys(viewMap).length > 0 && viewMap['system'] === true);
          if (hasSystemAccess) {
            result.push(item);
          }
          continue;
        }

        const filteredItems = item.items.filter(subItem => isPathAccessible(subItem.path));

        if (filteredItems.length > 0) {
          result.push({ ...item, items: filteredItems });
        }
      } else if (item.path) {
        if (isPathAccessible(item.path)) {
          result.push(item);
        }
      }
    }

    return result;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const isOutside = Object.values(dropdownRefs.current).every(
      ref => !ref || !ref.contains(event.target as Node)
    );
    if (isOutside) {
      setOpenDropdown(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleDropdown = useCallback((title: string) => {
    setOpenDropdown(prev => prev === title ? null : title);
  }, []);

  const handleNavigation = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  const setDropdownRef = (title: string, node: HTMLDivElement | null) => {
    dropdownRefs.current[title] = node;
  };

  return (
    <nav className={`bg-white shadow-lg z-50 ${isMenuOpen ? 'fixed top-0 left-0 right-0' : 'sticky top-0 relative'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo/Brand */}
          <div className="flex-shrink-0 mr-1 lg:mr-8">
            <div className="text-sm font-bold text-blue-700 leading-tight">
              <div className="text-xs sm:text-sm lg:text-base font-bold">Sistem Informasi Peralatan</div>
              <div className="text-[10px] sm:text-xs font-medium text-blue-600">Modern Widya Tehnical</div>
              {activeProject && (
                <div className="text-[9px] sm:text-[10px] font-semibold text-blue-800 mt-0.5">
                  {activeProject.namaProject}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-0.5">
            {getAccessibleMenuItems().map((item) => (
              <div key={item.path || item.title} className="relative group">
                {item.items ? (
                  <div className="relative" ref={node => setDropdownRef(item.title, node)}>
                    <button
                      onClick={() => toggleDropdown(item.title)}
                      className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${(item as any).adminOnly
                        ? item.items?.some(subItem => location.pathname === subItem.path)
                          ? 'bg-red-50 text-red-700 font-medium'
                          : 'text-red-600 hover:bg-red-50/50 hover:text-red-700'
                        : item.items?.some(subItem => location.pathname === subItem.path)
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-600'
                        }`}
                    >
                      {(item as any).adminOnly && <Settings className="h-3.5 w-3.5" />}
                      <span>{item.title}</span>
                      {openDropdown === item.title ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {openDropdown === item.title && (
                      <div className={`absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg ring-1 overflow-hidden z-50 ${(item as any).adminOnly ? 'ring-red-100' : 'ring-black ring-opacity-5'}`}>
                        {(item as any).adminOnly && (
                          <div className="px-4 py-2 bg-red-50 border-b border-red-100">
                            <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                              <Settings className="h-3 w-3" /> Administrasi Sistem
                            </p>
                          </div>
                        )}
                        <div className="py-1">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => handleNavigation()}
                              className={`block px-4 py-2.5 text-sm transition-colors ${location.pathname === subItem.path
                                ? (item as any).adminOnly ? 'bg-red-50 text-red-700 font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                                : (item as any).adminOnly ? 'text-gray-700 hover:bg-red-50/50 hover:text-red-600' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                }`}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : item.path ? (
                  <Link
                    to={item.path}
                    className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-600'
                      }`}
                  >
                    {item.title}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* User Info */}
            {user && (
              <div className="hidden lg:flex items-center space-x-3 pr-4 border-r border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                  <div className="flex items-center text-xs text-gray-500 gap-1">
                    <Shield className="w-3 h-3" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                  {userStats && (
                    <div className="flex items-center text-[10px] text-gray-400 gap-1 mt-0.5 whitespace-nowrap">
                      <Users className="w-2.5 h-2.5 text-gray-400" />
                      <span>{userStats.total} user</span>
                      <span className="text-gray-300">•</span>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 font-medium">{userStats.online} online</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hidden lg:flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs">Keluar</span>
            </Button>
            {/* Mobile User Info (Hanya tampil saat menu open, di sebelah kiri tombol Logout/silang X) */}
            {user && isMenuOpen && (
              <div className="lg:hidden flex items-center space-x-1 bg-blue-50/50 py-0.5 px-1.5 rounded-md border border-blue-100 mr-0.5 max-w-[100px] flex-shrink-0">
                <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full flex-shrink-0">
                  <User className="w-2.5 h-2.5 text-blue-600" />
                </div>
                <div className="text-[9px] leading-tight truncate">
                  <div className="font-semibold text-gray-900 truncate max-w-[50px]">{user.full_name}</div>
                  {userStats && (
                    <div className="flex items-center text-[7.5px] text-gray-500 gap-0.5 whitespace-nowrap">
                      <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 font-medium">{userStats.online} on</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="lg:hidden flex items-center space-x-1">
              {!isMenuOpen && (
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-red-50 transition-colors text-xs font-semibold mr-1"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              )}
              <button
                onClick={toggleMenu}
                className="text-gray-600 hover:text-gray-900 w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu (Constrained to 75vh height and scrollable) */}
        <div className={`lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl overflow-y-auto transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[75vh] py-2' : 'max-h-0'}`}>
          <div className="space-y-1">
            {getAccessibleMenuItems().map((item, index) => (
              <div key={`${item.title}-${index}`} className="px-2">
                {item.items ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm font-medium text-gray-700">
                      {item.title}
                    </div>
                    <div className="pl-4 space-y-1 border-l-2 border-gray-100">
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={`${subItem.path}-${subIndex}`}
                          to={subItem.path}
                          onClick={() => {
                            handleNavigation();
                            toggleMenu();
                          }}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${location.pathname === subItem.path
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                            }`}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : item.path ? (
                  <Link
                    to={item.path}
                    onClick={toggleMenu}
                    className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                  >
                    {item.title}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
