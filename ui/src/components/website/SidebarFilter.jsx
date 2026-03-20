import React, { useState } from "react";
import {
  Minus,
  Plus,
  X,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // 🟢 Navigation ke liye import

const SidebarFilter = ({
  filters,
  handleFilterChange,
  categories,
  subcategories,
  subcategoriesLabel = "Sub Categories",
  formats,
  authors, // 🟢 New Prop
  publishers, // 🟢 New Prop
  series, // 🟢 New Prop
  isSalePage = false, // 🟢 Sale page pe sirf categories dikhani hai
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate(); // 🟢 Hook for redirection

  // --- MOBILE ONLY STATE ---
  const [activeTab, setActiveTab] = useState("categories");

  // --- DESKTOP ACCORDION STATES ---
  const [expandedCats, setExpandedCats] = useState({});

  // 🟢 Updated State with new sections
  const [openSections, setOpenSections] = useState({
    categories: true,
    popular: false,
    format: false,
    price: false,
    rating: false,
    date: false,
    authors: false, // New
    publishers: false, // New
    series: false, // New
    sort: false, // 🟢 reserved (hidden)
  });

  // 🟢 Show All toggles for sections with many items
  const [showAllStates, setShowAllStates] = useState({
    categories: false,
    authors: false,
    publishers: false,
    series: false,
  });

  const toggleShowAll = (section) => {
    setShowAllStates((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCat = (id) => {
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // 🟢 Category Navigation Handler
  const handleCategoryClick = (catId) => {
    // Abhi page nahi bana hai, isliye console log aur temporary path rakha hai
    console.log("Navigating to category:", catId);
    navigate(`/category/${catId}`); // Jab route ban jaye tab ye chalega
    if (onClose) onClose(); // Mobile drawer band karne ke liye
  };

  // Reusable Section Header for Desktop
  const FilterHeader = ({ title, section, count = 0 }) => (
    <div
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between cursor-pointer py-3 border-b border-cream-100 group"
    >
      <h3 className="font-bold text-[13px] text-text-main uppercase tracking-widest font-montserrat flex items-center gap-2">
        {openSections[section] ? (
          <Minus size={14} className="text-primary" />
        ) : (
          <Plus size={14} className="text-primary" />
        )}
        {title}
        {count > 0 && (
          <span className="ml-1 text-[10px] bg-primary text-white px-1.5 rounded-full">
            {count}
          </span>
        )}
      </h3>
    </div>
  );

  // 🟢 Recursive Category Node (Updated: Checkbox Removed, Clickable Text)
  const CategoryNode = ({ cat, level }) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedCats[cat._id];

    return (
      <div
        className={`select-none ${level > 0 ? "ml-4 border-l border-cream-200 pl-3" : "mb-1"}`}
      >
        <div className="flex items-center justify-between group py-1.5">
          {/* Checkbox hata diya, ab ye div clickable hai */}
          <div
            onClick={() => handleCategoryClick(cat._id)}
            className="flex items-center space-x-3 cursor-pointer flex-1 hover:text-primary transition-colors"
          >
            <span
              className={`text-sm font-body text-text-main group-hover:text-primary`}
            >
              {cat.categorytitle || cat.title}
            </span>
          </div>

          {/* Expand/Collapse Button for Subcategories */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCat(cat._id);
              }}
              className="p-1 text-cream-200 hover:text-primary transition-colors"
            >
              {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {cat.children.map((child) => (
              <CategoryNode key={child._id} cat={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // 🟢 Updated Mobile Tabs (Sale page pe sirf categories)
  const mobileTabs = isSalePage
    ? [{ id: "categories", label: "Categories" }]
    : [
        { id: "categories", label: "Categories" },
        { id: "authors", label: "Authors" },
        { id: "publishers", label: "Publishers" },
        { id: "series", label: "Series" },
        { id: "popular", label: "Popular" },
        { id: "format", label: "Formats" },
        { id: "price", label: "Price" },
        { id: "rating", label: "Ratings" },
      ];

  return (
    <>
      {/* --- MOBILE DRAWER --- */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div
          className="absolute inset-0 bg-text-main/60 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col transition-transform duration-500 transform ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="flex items-center justify-between p-6 border-b border-cream-100 bg-cream-50/30 rounded-t-[2.5rem]">
            <div>
              <h2 className="text-lg font-display font-bold text-text-main uppercase tracking-widest">
                Filters
              </h2>
              <p className="text-[10px] text-text-muted font-montserrat uppercase tracking-slick">
                Refine your results
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleFilterChange("clear")}
                className="text-xs font-bold text-primary hover:underline font-montserrat uppercase"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white rounded-full shadow-sm border border-cream-100 text-text-main active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Side: Tabs */}
            <div className="w-1/3 bg-cream-50/50 border-r border-cream-100 overflow-y-auto">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full py-5 px-4 text-left text-[11px] font-bold font-montserrat uppercase tracking-wider transition-all border-b border-cream-100 ${activeTab === tab.id ? "bg-white text-primary border-r-4 border-primary" : "text-text-muted opacity-60"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Side: Options area */}
            <div className="w-2/3 bg-white overflow-y-auto p-4 pb-24">
              {/* Categories / Subcategories (No Checkbox, Click to Navigate) */}
              {activeTab === "categories" &&
                (subcategories && subcategories.length > 0
                  ? subcategories.map((subcat) => (
                      <div
                        key={subcat._id}
                        onClick={() => {
                          navigate(`/books/${subcat.slug.split('/').pop()}`);
                          if (onClose) onClose();
                        }}
                        className="flex items-center justify-between py-3 border-b border-cream-50 cursor-pointer hover:bg-gray-50"
                      >
                        <span className="text-sm text-text-main">
                          {subcat.categorytitle}
                        </span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    ))
                  : (
                      <div className="text-xs text-text-muted italic py-3">
                        No sub categories
                      </div>
                    )
                )}

              {/* 🟢 Authors Mobile */}
              {activeTab === "authors" &&
                authors?.map((auth) => (
                  <label
                    key={auth._id}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <span
                      className={`text-sm ${filters.authors?.includes(auth._id) ? "text-primary font-bold" : "text-text-main"}`}
                    >
                      {auth.first_name} {auth.last_name}
                    </span>
                    <input
                      type="checkbox"
                      checked={filters.authors?.includes(auth._id)}
                      onChange={() => handleFilterChange("authors", auth._id)}
                      className="w-5 h-5 rounded border-cream-200 text-primary accent-primary"
                    />
                  </label>
                ))}

              {/* 🟢 Publishers Mobile */}
              {activeTab === "publishers" &&
                publishers?.map((pub) => (
                  <label
                    key={pub._id}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <span
                      className={`text-sm ${filters.publishers?.includes(pub._id) ? "text-primary font-bold" : "text-text-main"}`}
                    >
                      {pub.name || pub.title}
                    </span>
                    <input
                      type="checkbox"
                      checked={filters.publishers?.includes(pub._id)}
                      onChange={() => handleFilterChange("publishers", pub._id)}
                      className="w-5 h-5 rounded border-cream-200 text-primary accent-primary"
                    />
                  </label>
                ))}

              {/* 🟢 Series Mobile */}
              {activeTab === "series" &&
                series?.map((ser) => (
                  <label
                    key={ser._id}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <span
                      className={`text-sm ${filters.series?.includes(ser._id) ? "text-primary font-bold" : "text-text-main"}`}
                    >
                      {ser.title}
                    </span>
                    <input
                      type="checkbox"
                      checked={filters.series?.includes(ser._id)}
                      onChange={() => handleFilterChange("series", ser._id)}
                      className="w-5 h-5 rounded border-cream-200 text-primary accent-primary"
                    />
                  </label>
                ))}

              {/* Existing Tabs... */}
              {activeTab === "popular" &&
                [
                  { label: "New Arrivals", key: "isNewRelease" },
                  { label: "Bestsellers", key: "isBestseller" },
                  { label: "Recommended", key: "isRecommended" },
                  { label: "Sale", key: "isSale" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <span
                      className={`text-sm ${filters[opt.key] ? "text-primary font-bold" : "text-text-main"}`}
                    >
                      {opt.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={!!filters[opt.key]}
                      onChange={() =>
                        handleFilterChange(opt.key, !filters[opt.key])
                      }
                      className="w-5 h-5 rounded border-cream-200 text-primary focus:ring-primary accent-primary"
                    />
                  </label>
                ))}

              {activeTab === "format" &&
                formats?.map((fmt) => (
                  <label
                    key={fmt}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <span
                      className={`text-sm capitalize ${filters.formats?.includes(fmt) ? "text-primary font-bold" : "text-text-main"}`}
                    >
                      {fmt}
                    </span>
                    <input
                      type="checkbox"
                      checked={filters.formats?.includes(fmt)}
                      onChange={() => handleFilterChange("formats", fmt)}
                      className="w-5 h-5 rounded border-cream-200 text-primary accent-primary"
                    />
                  </label>
                ))}

              {activeTab === "price" &&
                [
                  { label: "All Prices", val: "" },
                  { label: "Under ₹500", val: "0-500" },
                  { label: "₹500 - ₹1000", val: "500-1000" },
                  { label: "₹1000 - ₹2000", val: "1000-2000" },
                  { label: "₹2000 - ₹5000", val: "2000-5000" },
                  { label: "Above ₹5000", val: "5000-100000" },
                ].map((range) => (
                  <label
                    key={range.val}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <span
                      className={`text-sm ${filters.price === range.val ? "text-primary font-bold" : "text-text-main"}`}
                    >
                      {range.label}
                    </span>
                    <input
                      type="radio"
                      checked={filters.price === range.val}
                      onChange={() => handleFilterChange("price", range.val)}
                      className="w-5 h-5 border-cream-200 text-primary accent-primary"
                    />
                  </label>
                ))}

              {activeTab === "rating" &&
                [4, 3, 2, 1].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center justify-between py-3 border-b border-cream-50"
                  >
                    <div className="flex items-center gap-1">
                      <span className="flex text-accent">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rating ? "currentColor" : "none"}
                            className={
                              i < rating ? "text-accent" : "text-cream-200"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-xs font-bold text-text-muted">
                        & Up
                      </span>
                    </div>
                    <input
                      type="radio"
                      checked={Number(filters.rating) === rating}
                      onChange={() => handleFilterChange("rating", rating)}
                      className="w-5 h-5 border-cream-200 text-primary accent-primary"
                    />
                  </label>
                ))}

            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-cream-100 flex gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => handleFilterChange("clear")}
              className="flex-1 py-4 text-xs font-bold text-text-muted border border-cream-200 rounded-2xl font-montserrat uppercase tracking-widest"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 text-xs font-bold text-white bg-primary rounded-2xl font-montserrat uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* --- DESKTOP SIDEBAR (ACCORDION STYLE) --- */}
      <div className="hidden md:flex flex-col w-full bg-white rounded-xl border border-cream-200 shadow-sm  font-body h-fit sticky top-32">
        <div className="flex items-center justify-between p-5 border-b border-cream-100 bg-cream-50/30">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-widest font-montserrat">
            Filters
          </h2>
          <button
            onClick={() => handleFilterChange("clear")}
            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
          >
            Clear All
          </button>
        </div>

        <div className="p-4 space-y-2  custom-scrollbar">
          {/* 1. Sub Categories */}
          <div>
            <FilterHeader title={subcategoriesLabel} section="categories" />
            {openSections.categories && (
              <div className="pt-3 space-y-2 pl-2">
                {subcategories && subcategories.length > 0 ? (
                  <>
                    {(showAllStates.categories
                      ? subcategories
                      : subcategories.slice(0, 15)
                    ).map((subcat) => (
                      <div
                        key={subcat._id}
                        onClick={() => {
                          navigate(`/books/${subcat.slug.split('/').pop()}`);
                          if (onClose) onClose();
                        }}
                        className="flex items-center space-x-3 cursor-pointer group py-1.5 hover:text-primary transition-colors select-none"
                      >
                        <span className="text-sm font-body text-text-main group-hover:text-primary">
                          {subcat.categorytitle}
                        </span>
                      </div>
                    ))}
                    {subcategories.length > 15 && (
                      <button
                        onClick={() => toggleShowAll("categories")}
                        className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1 font-montserrat uppercase tracking-wide"
                      >
                        {showAllStates.categories ? (
                          <>
                            Show Less <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            Browse All ({subcategories.length}){" "}
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-text-muted italic">
                    No sub categories
                  </div>
                )}
              </div>
            )}
          </div>

          {!isSalePage && (<>
          {/* 5. Popular Options (Old) */}
          <div className="pt-2">
            <FilterHeader title="Popular Options" section="popular" />
            {openSections.popular && (
              <div className="pt-3 space-y-3 pl-1">
                {[
                  { label: "New Arrivals", key: "isNewRelease" },
                  { label: "Bestsellers", key: "isBestseller" },
                  { label: "Recommended", key: "isRecommended" },
                  { label: "Sale", key: "isSale" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={!!filters[opt.key]}
                      onChange={() =>
                        handleFilterChange(opt.key, !filters[opt.key])
                      }
                      className="w-4 h-4 rounded border-cream-200 text-primary focus:ring-primary accent-primary"
                    />
                    <span
                      className={`text-sm ${filters[opt.key] ? "font-bold text-primary" : "text-text-muted group-hover:text-primary"}`}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 🟢 2. Authors (New Section) */}
          <div className="pt-2">
            <FilterHeader
              title="Authors"
              section="authors"
              count={filters.authors?.length || 0}
            />
            {openSections.authors && (
              <div className="pt-3 space-y-3 pl-1">
                {authors?.length > 0 ? (
                  <>
                    {(showAllStates.authors
                      ? authors
                      : authors.slice(0, 15)
                    ).map((auth) => (
                      <label
                        key={auth._id}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={filters.authors?.includes(auth._id)}
                          onChange={() =>
                            handleFilterChange("authors", auth._id)
                          }
                          className="w-4 h-4 rounded border-cream-200 text-primary focus:ring-primary accent-primary"
                        />
                        <span className="text-sm text-text-muted group-hover:text-primary font-body">
                          {auth.first_name} {auth.last_name}
                        </span>
                      </label>
                    ))}
                    {authors.length > 15 && (
                      <button
                        onClick={() => toggleShowAll("authors")}
                        className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1 font-montserrat uppercase tracking-wide"
                      >
                        {showAllStates.authors ? (
                          <>
                            Show Less <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            Browse All ({authors.length}){" "}
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-text-muted">
                    No authors found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🟢 3. Publishers (New Section) */}
          <div className="pt-2">
            <FilterHeader
              title="Publishers"
              section="publishers"
              count={filters.publishers?.length || 0}
            />
            {openSections.publishers && (
              <div className="pt-3 space-y-3 pl-1">
                {publishers?.length > 0 ? (
                  <>
                    {(showAllStates.publishers
                      ? publishers
                      : publishers.slice(0, 15)
                    ).map((pub) => (
                      <label
                        key={pub._id}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={filters.publishers?.includes(pub._id)}
                          onChange={() =>
                            handleFilterChange("publishers", pub._id)
                          }
                          className="w-4 h-4 rounded border-cream-200 text-primary focus:ring-primary accent-primary"
                        />
                        <span className="text-sm text-text-muted group-hover:text-primary font-body">
                          {pub.name || pub.title}
                        </span>
                      </label>
                    ))}
                    {publishers.length > 15 && (
                      <button
                        onClick={() => toggleShowAll("publishers")}
                        className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1 font-montserrat uppercase tracking-wide"
                      >
                        {showAllStates.publishers ? (
                          <>
                            Show Less <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            Browse All ({publishers.length}){" "}
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-text-muted">
                    No publishers found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🟢 4. Series (New Section) */}
          <div className="pt-2">
            <FilterHeader
              title="Series"
              section="series"
              count={filters.series?.length || 0}
            />
            {openSections.series && (
              <div className="pt-3 space-y-3 pl-1">
                {series?.length > 0 ? (
                  <>
                    {(showAllStates.series ? series : series.slice(0, 15)).map(
                      (ser) => (
                        <label
                          key={ser._id}
                          className="flex items-center space-x-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={filters.series?.includes(ser._id)}
                            onChange={() =>
                              handleFilterChange("series", ser._id)
                            }
                            className="w-4 h-4 rounded border-cream-200 text-primary focus:ring-primary accent-primary"
                          />
                          <span className="text-sm text-text-muted group-hover:text-primary font-body">
                            {ser.title}
                          </span>
                        </label>
                      ),
                    )}
                    {series.length > 15 && (
                      <button
                        onClick={() => toggleShowAll("series")}
                        className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1 font-montserrat uppercase tracking-wide"
                      >
                        {showAllStates.series ? (
                          <>
                            Show Less <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            Browse All ({series.length}){" "}
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-text-muted">No series found</div>
                )}
              </div>
            )}
          </div>

          {/* 6. Format */}
          <div className="pt-2">
            <FilterHeader
              title="Format"
              section="format"
              count={filters.formats?.length || 0}
            />
            {openSections.format && (
              <div className="pt-3 space-y-3 pl-1">
                {formats?.map((fmt) => (
                  <label
                    key={fmt}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.formats?.includes(fmt)}
                      onChange={() => handleFilterChange("formats", fmt)}
                      className="w-4 h-4 rounded border-cream-200 text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-sm text-text-muted group-hover:text-primary capitalize font-body">
                      {fmt}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 7. Price */}
          <div className="pt-2">
            <FilterHeader title="Price" section="price" />
            {openSections.price && (
              <div className="pt-3 space-y-3 pl-1">
                {[
                  { label: "All Prices", val: "" },
                  { label: "Under ₹500", val: "0-500" },
                  { label: "₹500 - ₹1000", val: "500-1000" },
                  { label: "₹1000 - ₹2000", val: "1000-2000" },
                  { label: "₹2000 - ₹5000", val: "2000-5000" },
                  { label: "Above ₹5000", val: "5000-100000" },
                ].map((range) => (
                  <label
                    key={range.val}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="d_price"
                      checked={filters.price === range.val}
                      onChange={() => handleFilterChange("price", range.val)}
                      className="w-4 h-4 border-cream-200 text-primary accent-primary"
                    />
                    <span
                      className={`text-sm ${filters.price === range.val ? "font-bold text-primary" : "text-text-muted group-hover:text-primary"}`}
                    >
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 8. Ratings */}
          <div className="pt-2 pb-2">
            <FilterHeader title="Customer Rating" section="rating" />
            {openSections.rating && (
              <div className="pt-2 space-y-2 pl-1">
                {[4, 3, 2, 1].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="d_rating"
                      checked={Number(filters.rating) === rating}
                      onChange={() => handleFilterChange("rating", rating)}
                      className="w-4 h-4 border-cream-200 text-primary accent-primary"
                    />
                    <div className="flex items-center text-sm text-text-muted group-hover:text-primary">
                      <span className="flex text-accent mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rating ? "currentColor" : "none"}
                            className={
                              i < rating ? "text-accent" : "text-cream-200"
                            }
                          />
                        ))}
                      </span>
                      & Up
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          </> )}
        </div>
      </div>
    </>
  );
};

export default SidebarFilter;
