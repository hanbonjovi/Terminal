import type { StockCategory } from '../data/categories'

interface CategoryToggleProps {
  categories: StockCategory[]
  activeId: string
  onSelect: (id: string) => void
}

export function CategoryToggle({ categories, activeId, onSelect }: CategoryToggleProps) {
  return (
    <div className="border-b border-gray-800 px-4 py-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {categories.map((cat) => {
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`
                px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap
                ${
                  isActive
                    ? 'category-active text-white border'
                    : 'text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-200'
                }
              `}
              style={
                isActive
                  ? { backgroundColor: `${cat.color}20`, borderColor: cat.color, color: cat.color }
                  : undefined
              }
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
