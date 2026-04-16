import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ChevronDown, Book, Loader2, Tag, ArrowRight } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`),
          axios.get(`${process.env.REACT_APP_API_URL}/tags/list`),
        ]);

        if (catRes.data.status) {
          const rawData = catRes.data.data || catRes.data.categories || [];
          setCategories(buildCategoryTree(rawData));
        }

        if (tagRes.data.status && tagRes.data.data) {
          setTags(tagRes.data.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body text-text-main pb-16">

      {/* Page Header */}
      <div className="bg-primary py-10 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wide">
          Browse All Categories
        </h1>
        <div className="w-20 h-1 bg-white/40 mx-auto mt-4 rounded-full" />
      </div>

      {/* Categories Accordion List */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-3">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <CategoryAccordion key={cat.id || cat._id} category={cat} />
          ))
        ) : (
          <p className="text-center text-text-muted font-semibold py-10">
            No categories found.
          </p>
        )}
      </div>

      {/* Special Topics / Tags */}
      {tags.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main uppercase tracking-wide">
              Special Topics
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-3 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {tags.map((tag) => (
              <span
                key={tag.id || tag._id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-primary/20 text-primary rounded-full text-sm font-semibold shadow-sm hover:bg-primary hover:text-white cursor-pointer transition-all duration-200"
              >
                <Tag size={14} />
                {tag.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Single accordion card for a top-level category ─── */
const CategoryAccordion = ({ category }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const catTitle = category.title || category.categorytitle || '';

  return (
    <div className="bg-white rounded-lg border border-cream-200 shadow-sm overflow-hidden">

      {/* Header row */}
      <button
        type="button"
        onClick={() => hasChildren ? setIsOpen(!isOpen) : navigate(`/books/${category.slug}`)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Book size={16} className="text-primary" />
          </span>
          <span className="font-bold text-[15px] text-text-main uppercase tracking-wide truncate">
            {catTitle}
          </span>
          {hasChildren && (
            <span className="flex-shrink-0 text-[11px] font-semibold text-text-muted bg-cream-100 px-2 py-0.5 rounded-full">
              {category.children.length}
            </span>
          )}
        </div>

        {hasChildren ? (
          <ChevronDown
            size={18}
            className={`flex-shrink-0 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        ) : (
          <ArrowRight size={16} className="flex-shrink-0 text-text-muted" />
        )}
      </button>

      {/* Subcategories dropdown */}
      {hasChildren && (
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-400 ease-in-out ${
            isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-cream-100">
            {/* View All row */}
            <SubcategoryRow
              label={`View all in ${catTitle}`}
              slug={category.slug}
              isViewAll
            />
            {/* Children */}
            {category.children.map((child) => (
              <SubcategoryRow
                key={child.id || child._id}
                label={child.title || child.categorytitle}
                slug={child.slug}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── A single row inside the dropdown ─── */
const SubcategoryRow = ({ label, slug, isViewAll }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => slug && navigate(`/books/${slug}`)}
      className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-cream-50 transition-colors border-b border-cream-50 last:border-0 ${
        isViewAll ? 'text-primary font-bold' : 'text-text-main font-medium'
      }`}
    >
      <span className={`text-[13px] ${isViewAll ? 'italic' : ''}`}>
        {isViewAll ? `→ ${label}` : label}
      </span>
      <ArrowRight size={13} className="text-text-muted flex-shrink-0" />
    </button>
  );
};

/* ─── Build nested tree from flat list ───
 * parentId = 0 means root.
 * Also treat a category as root if its parent has an empty title
 * (id=1 and id=2 in the DB are invisible "super-root" placeholders).
 */
const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];

  categories.forEach((cat) => {
    const id = cat.id ?? cat._id;
    map[id] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    const id = cat.id ?? cat._id;
    const parentId = cat.parentId ?? cat.parentid ?? 0;
    const parent = map[parentId];
    // Treat as root if: no parentId, parent not found, or parent has empty title
    if (!parentId || !parent || !(parent.title || parent.category_title || '').trim()) {
      roots.push(map[id]);
    } else {
      parent.children.push(map[id]);
    }
  });

  return roots;
};

export default Categories;
