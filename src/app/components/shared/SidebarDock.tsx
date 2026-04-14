import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'

export type SidebarDockItem = {
  path: string
  label: string
  icon: React.ElementType
  colorClassName?: string
}

function DockItem({
  item,
  mouseY,
}: {
  item: SidebarDockItem
  mouseY: ReturnType<typeof useMotionValue<number>>
}) {
  const location = useLocation()
  const isActive = location.pathname === item.path

  const itemCenterY = useMotionValue(0)
  const distance = useTransform(mouseY, (y) => Math.abs(y - itemCenterY.get()))
  const rawScale = useTransform(distance, [0, 160], [1.7, 1])
  const scale = useSpring(rawScale, { stiffness: 400, damping: 35, mass: 0.4 })

  const rawLift = useTransform(distance, [0, 160], [-6, 0])
  const lift = useSpring(rawLift, { stiffness: 400, damping: 35, mass: 0.4 })

  const bg = isActive
    ? 'bg-emerald-500/10 border-emerald-500/20'
    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'

  return (
    <li className="relative">
      <Link
        to={item.path}
        className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-colors ${bg}`}
        aria-label={item.label}
      >
        <motion.div
          style={{ scale, y: lift }}
          className="relative flex items-center justify-center w-full h-full"
          ref={(el) => {
            if (!el) return
            const rect = el.getBoundingClientRect()
            itemCenterY.set(rect.top + rect.height / 2)
          }}
        >
          <item.icon
            className={`w-5 h-5 ${
              item.colorClassName ?? (isActive ? 'text-emerald-400' : 'text-slate-300')
            }`}
          />
        </motion.div>

        <div className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 shadow-lg whitespace-nowrap">
            {item.label}
          </div>
        </div>
      </Link>
    </li>
  )
}

export function SidebarDock({
  primaryItems,
  secondaryItems,
}: {
  primaryItems: SidebarDockItem[]
  secondaryItems?: SidebarDockItem[]
}) {
  const mouseY = useMotionValue(-9999)

  const all = useMemo(
    () => ({ primary: primaryItems, secondary: secondaryItems ?? [] }),
    [primaryItems, secondaryItems]
  )

  return (
    <div
      className="px-2 py-3"
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(-9999)}
    >
      <ul className="flex flex-col items-center gap-2">
        {all.primary.map((item) => (
          <DockItem key={item.path} item={item} mouseY={mouseY} />
        ))}

        {all.secondary.length > 0 && (
          <>
            <li className="w-8 h-px bg-slate-800 my-2" />
            {all.secondary.map((item) => (
              <DockItem key={item.path} item={item} mouseY={mouseY} />
            ))}
          </>
        )}
      </ul>
    </div>
  )
}
