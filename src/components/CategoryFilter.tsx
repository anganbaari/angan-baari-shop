import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryFilter({
  categories,
  selectedCategoryId,
}: {
  categories: Category[];
  selectedCategoryId?: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/"
        className={`rounded-full border px-4 py-1.5 text-sm transition ${
          !selectedCategoryId
            ? "border-forest bg-forest text-cream"
            : "border-mist text-forest hover:border-moss hover:text-moss"
        }`}
      >
        All
      </Link>
      {categories.map((category) => {
        const isSelected = selectedCategoryId === String(category.id);
        return (
          <Link
            key={category.id}
            href={`/?category=${category.id}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              isSelected
                ? "border-forest bg-forest text-cream"
                : "border-mist text-forest hover:border-moss hover:text-moss"
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}
