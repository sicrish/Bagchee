import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ChevronDown, Book, Loader2, Tag } from 'lucide-react';

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

      {/* Categories Section */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main uppercase tracking-wide">
            Browse All Categories
          </h1>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <CategoryPill key={cat.id || cat._id} category={cat} />
            ))}
          </div>
        ) : (
          <p className="text-center text-text-muted font-semibold py-10">
            No categories found.
          </p>
        )}
      </div>

      {/* Special Topics / Tags */}
      {tags.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main uppercase tracking-wide">
              Special Topics
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <TagPill key={tag.id || tag._id} tag={tag} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Blue pill button for a category (recursive) ─── */
const CategoryPill = ({ category, depth = 0 }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const catTitle = category.title || category.categorytitle || '';

  const handleClick = () => {
    if (hasChildren) setIsOpen(!isOpen);
    else if (category.slug) navigate(`/books/${category.slug}`);
  };

  // Depth-based styling: darker/brighter at root, lighter shades as we go deeper
  const bgByDepth = ['bg-primary hover:bg-primary/90', 'bg-primary/80 hover:bg-primary', 'bg-primary/70 hover:bg-primary', 'bg-primary/60 hover:bg-primary'];
  const rowBg = bgByDepth[Math.min(depth, bgByDepth.length - 1)];
  const textSize = depth === 0 ? 'text-sm' : 'text-xs';
  const iconSize = depth === 0 ? 16 : 14;
  const paddingY = depth === 0 ? 'py-3' : 'py-2.5';

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center justify-between ${rowBg} text-white rounded-lg px-4 ${paddingY} transition-colors duration-150`}
      >
        <div className="flex items-center gap-3">
          <Book size={iconSize} className="flex-shrink-0 opacity-90" />
          <span className={`font-bold ${textSize} uppercase tracking-wide text-left`}>
            {catTitle}
          </span>
        </div>
        {hasChildren && (
          <ChevronDown
            size={iconSize}
            className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary/30 pl-2">
          {category.slug && (
            <button
              type="button"
              onClick={() => navigate(`/books/${category.slug}`)}
              className="w-full flex items-center gap-3 bg-primary/50 hover:bg-primary text-white rounded-lg px-4 py-2 transition-colors duration-150"
            >
              <Book size={12} className="flex-shrink-0 opacity-80" />
              <span className="font-semibold text-[11px] uppercase tracking-wide">
                View all in {catTitle}
              </span>
            </button>
          )}
          {category.children.map((child) => (
            <CategoryPill key={child.id || child._id} category={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Blue pill button for a tag ─── */
const TagPill = ({ tag }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => tag.slug && navigate(`/books/${tag.slug}`)}
      className="w-full flex items-center gap-3 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-3 transition-colors duration-150"
    >
      <Tag size={16} className="flex-shrink-0 opacity-90" />
      <span className="font-bold text-sm uppercase tracking-wide text-left">
        {tag.title}
      </span>
    </button>
  );
};

/* ─── Build nested tree from flat list ─── */
const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];

  categories.forEach((cat) => {
    const id = cat.id ?? cat._id;
    const title = (cat.title || cat.category_title || '').trim();
    if (!title) return;
    map[id] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    const id = cat.id ?? cat._id;
    if (!map[id]) return;
    const parentId = cat.parentId ?? cat.parentid ?? 0;
    const parent = map[parentId];
    if (!parentId || !parent || !(parent.title || parent.category_title || '').trim()) {
      roots.push(map[id]);
    } else {
      parent.children.push(map[id]);
    }
  });

  return roots;
};

export default Categories;
