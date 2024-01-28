import { categoryOptions } from "@/types/options";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useCategoryFilterStore } from "@/hooks/states/useCategoryFilterStore";

const CategoryBadgeFilter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const categories = useCategoryFilterStore((state) => state.filter);
  const addCategory = useCategoryFilterStore((state) => state.addCategories);
  const removeCategory = useCategoryFilterStore(
    (state) => state.removeCategory
  );
  const removeAll = useCategoryFilterStore((state) => state.removeAll);

  return (
    <div className={cn("flex flex-wrap gap-4 ", className)} {...props}>
      <Badge
        variant={null}
        className={cn(
          categories.length === categoryOptions.length
            ? "bg-primary hover:brightness-110"
            : "hover:bg-primary/90",
          "hover:cursor-pointer rounded-2xl px-4 py-2 "
        )}
        onClick={() => {
          if (categories.length === categoryOptions.length) {
            removeAll();
          } else {
            addCategory(categoryOptions.map((cat) => cat.value));
          }
        }}
      >
        All
      </Badge>
      {categoryOptions.map((category) => (
        <Badge
          key={category.value}
          variant={"outline"}
          className={cn(
            categories.includes(category.value)
              ? "bg-primary hover:brightness-110"
              : "hover:bg-primary/90",
            "hover:cursor-pointer rounded-2xl px-4 py-2"
          )}
          onClick={() => {
            if (categories.includes(category.value)) {
              removeCategory(category.value);
            } else {
              addCategory([category.value]);
            }
          }}
        >
          {category.label}
        </Badge>
      ))}
    </div>
  );
};

export default CategoryBadgeFilter;
