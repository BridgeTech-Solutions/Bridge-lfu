'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuthPermissions } from '@/hooks'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  Shield,
  Server,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  User,
  Building
} from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'
import type { LucideIcon } from 'lucide-react'

type PermissionRequirement = {
  action: string
  resource: string
}

type NavigationChild = {
  name: string
  href: string
  permissions?: PermissionRequirement
  icon?: LucideIcon
}

type NavigationItem = {
  name: string
  href: string
  icon: LucideIcon
  permissions?: PermissionRequirement
  children?: NavigationChild[]
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const permissions = useAuthPermissions()
  const { user } = useAuth()
  const { t } = useTranslations('sidebar')

  useEffect(() => {
    if (collapsed) {
      setExpandedMenus({})
    }
  }, [collapsed])

  // Déterminer le lien et le label pour la section client
  const getClientNavItem = (): NavigationItem => {
    if (user?.role === 'client' && user?.client_id) {
      return {
        name: t('items.myCompany'),
        href: `/my-company`,
        icon: Building,
      }
    }
    return {
      name: t('items.clients'),
      href: '/clients',
      icon: Users,
      permissions: { resource: 'clients', action: 'read' },
      children: [
        {
          name: t('items.clientsList'),
          href: '/clients',
          permissions: { resource: 'clients', action: 'read' }
        },
        {
          name: t('items.clientsCreate'),
          href: '/clients/new',
          permissions: { resource: 'clients', action: 'create' }
        }
      ]
    }
  }

  const clientNavItem = getClientNavItem()

  const navigationItems: NavigationItem[] = [
    {
      name: t('items.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      permissions: { resource: 'dashboard', action: 'read' }
    },
    clientNavItem, // Utiliser l'item dynamique
    {
      name: t('items.licenses'),
      href: '/licenses',
      icon: Shield,
      permissions: { resource: 'licenses', action: 'read' },
      children: [
        {
          name: t('items.licensesList'),
          href: '/licenses',
          permissions: { resource: 'licenses', action: 'read' }
        },
        {
          name: t('items.licensesCreate'),
          href: '/licenses/new',
          permissions: { resource: 'licenses', action: 'create' }
        },
        {
          name: t('items.licenseSuppliers'),
          href: '/licenses/suppliers',
          permissions: { resource: 'license_suppliers', action: 'read' }
        },
        {
          name: t('items.licenseTypes'),
          href: '/license-types',
          permissions: { resource: 'licenses', action: 'read' }
        }
      ]
    },
    {
      name: t('items.equipment'),
      href: '/equipment',
      icon: Server,
      permissions: { resource: 'equipment', action: 'read' },
      children: [
        {
          name: t('items.equipmentList'),
          href: '/equipment',
          permissions: { resource: 'equipment', action: 'read' }
        },
        {
          name: t('items.equipmentCreate'),
          href: '/equipment/new',
          permissions: { resource: 'equipment', action: 'create' }
        },
        {
          name: t('items.equipmentTypes'), // Ou 'Types d\'équipement' en dur
          href: '/equipment-types',
          permissions: { resource: 'equipment', action: 'read' }
        }
        ,
        {
          name: t('items.equipmentBrands'),
          href: '/equipment-brands',
          permissions: { resource: 'equipment_brands', action: 'read' }
        }
      ]
    },
    {
      name: t('items.notifications'),
      href: '/notifications',
      icon: Bell,
      permissions: { resource: 'notifications', action: 'read' }
    },
    {
      name: t('items.reports'),
      href: '/reports',
      icon: FileText,
      permissions: { resource: 'reports', action: 'read' }
    },
    {
      name: t('items.users'),
      href: '/users',
      icon: User,
      permissions: { resource: 'users', action: 'read' },
      children: [
        {
          name: t('items.usersList'),
          href: '/users',
          permissions: { resource: 'users', action: 'read' }
        },
        // {
        //   name: t('items.usersCreate'),
        //   href: '/users/new',
        //   permissions: { resource: 'users', action: 'create' }
        // }
      ]
    },
  ]

  const bottomNavItems = [
    {
      name: t('items.help'),
      href: '/help',
      icon: HelpCircle,
    },
    {
      name: t('items.settings'),
      href: '/settings',
      icon: Settings,
    },
  ]

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return pathname === href
    
    // Pour les clients, considérer actif si on est sur la page détail de leur client
    if (user?.role === 'client' && user?.client_id && href.includes(user.client_id)) {
      return pathname?.includes(`/clients/${user.client_id}`)
    }
    
    return pathname?.startsWith(href)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canAccessRoute = (item: any) => {
    if (!item.permissions) return true

    const { action, resource } = item.permissions
    return permissions.can(action, resource) || hasConditionalPermission(action, resource)
  }

  const hasConditionalPermission = (action: string, resource: string) => {
    if (!permissions.getPermissions().clientAccess) return false
    if (action !== 'read') return false
    return ['reports', 'notifications', 'licenses', 'equipment'].includes(resource)
  }

  const toggleSubmenu = (key: string, currentState: boolean) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !currentState
    }))
  }

  return (
    <div className={cn(
      'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-gray-900">Bridge LFU</span>
          </Link>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const allowedChildren = (item.children ?? []).filter((child) => canAccessRoute(child))
          const childActive = allowedChildren.some((child) => isActiveRoute(child.href))
          const itemActive = isActiveRoute(item.href) || childActive
          const itemAccessible = canAccessRoute(item) || childActive || allowedChildren.length > 0

          if (!itemAccessible) {
            return null
          }

          const expandedState = expandedMenus[item.href]
          const isExpanded = !collapsed && (expandedState !== undefined ? expandedState : childActive)
          const showToggle = allowedChildren.length > 0

          return (
            <div key={item.name} className="space-y-1">
              <div
                className={cn(
                  'flex items-center',
                  collapsed ? 'justify-center' : 'justify-between'
                )}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors flex-1',
                    itemActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={cn(
                    'flex-shrink-0 h-5 w-5',
                    itemActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                    collapsed ? 'mx-auto' : 'mr-3'
                  )} />
                  {!collapsed && item.name}
                </Link>
                {showToggle && !collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.href, isExpanded)}
                    className={cn(
                      'ml-2 p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-transform'
                    )}
                    aria-label={isExpanded ? t('items.collapseSection', 'Replier la section') : t('items.expandSection', 'Déplier la section')}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      )}
                    />
                  </button>
                )}
              </div>
              {showToggle && isExpanded && (
                <div className="space-y-1 pl-9">
                  {allowedChildren.map((child) => {
                    const childIsActive = isActiveRoute(child.href)

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-colors',
                          childIsActive
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-gray-200 p-2 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActiveRoute(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                'flex-shrink-0 h-5 w-5',
                active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                collapsed ? 'mx-auto' : 'mr-3'
              )} />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}