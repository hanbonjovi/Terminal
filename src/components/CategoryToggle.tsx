import type { StockCategory } from '../data/categories'

interface CategoryToggleProps {
  categories: StockCategory[]
  activeId: string
  onSelect: (id: string) => void
}

export function CategoryToggle({ categories, activeId, onSelect }: CategoryToggleProps) {
  return (
    <div className="border-b border-gray-800 bg-[#060a12] px-2 py-1.5 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {categories.map((cat, idx) => {
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`
                px-2.5 py-1 rounded-sm text-[10px] font-bold transition-all whitespace-nowrap tracking-wide
                ${
                  isActive
                    ? 'text-white border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'text-gray-500 border border-transparent hover:border-gray-700 hover:text-gray-300'
                }
              `}
              style={
                isActive
                  ? { backgroundColor: `${cat.color}15`, borderColor: `${cat.color}60` }
                  : undefined
              }
            >
              <span className="mr-1 text-[10px] opacity-40">{idx + 1}</span>
              <span className="mr-1">{cat.icon}</span>
              {cat.name.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
