import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ChevronDown, ChevronRight, Book, Loader2, CornerDownRight, Eye, Tag } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]); // 🟢 New state for Tags

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories
        const categoriesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`); 
        if (categoriesResponse.data.status) {
          const rawData = categoriesResponse.data.data || categoriesResponse.data.categories;
          const tree = buildCategoryTree(rawData);
          setCategories(tree);
        }

        // 🟢 Fetch Tags for Special Topics
        const tagsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/tags/list`);
        if (tagsResponse.data.status && tagsResponse.data.data) {
          setTags(tagsResponse.data.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 text-primary">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-10 px-4 md:px-8 font-body">
      
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main uppercase tracking-wide">
          Browse All Categories
        </h1>
        <div className="w-24 h-1.5 bg-primary mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} level={0} />
          ))
        ) : (
          <p className="text-center col-span-full text-text-muted font-bold">No categories found.</p>
        )}
      </div>

      {/* 🟢 Special Topics Section - Displaying Tags */}
      {tags.length > 0 && (
        <div id="special-topics" className="max-w-[85rem] mx-auto mt-16 px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main uppercase tracking-wide">
              Special Topics
            </h2>
            <div className="w-24 h-1.5 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-center h-full"
              >
                <div className="flex flex-row items-center gap-2 px-4 py-3 bg-primary text-white rounded-md font-bold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer select-none w-full border-primary"
                >
                  <Tag size={18} className="text-white opacity-90 flex-shrink-0" />
                  <span className="line-clamp-1">{tag.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryItem = ({ category, level }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      navigate(`/books/${category.slug}`);
    }
  };

  // Color Logic
  const getLevelStyles = () => {
    switch (level) {
      case 0: 
        return 'bg-primary text-white shadow-lg border-primary';
      case 1: 
        return 'bg-white text-text-main shadow-sm border-l-4 border-secondary mt-2';
      case 2: 
        return 'bg-cream-100 text-text-main shadow-inner border-l-4 border-accent mt-2';
      default: 
        return 'bg-gray-100 text-gray-600 border-l-4 border-gray-300 mt-1';
    }
  };

  return (
    <div className="w-full transition-all duration-300">
      
      {/* --- CATEGORY BOX --- */}
      <div 
        onClick={handleClick}
        className={`
          flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 rounded-md
          font-bold uppercase tracking-wide text-sm select-none
          ${getLevelStyles()}
          ${level > 0 ? 'ml-4 md:ml-6' : ''} 
          hover:opacity-90 active:scale-[0.99]
        `}
      >
        <div className="flex items-center gap-3">
          {level === 0 && <Book size={18} className="text-white opacity-90" />}
          {level > 0 && <CornerDownRight size={14} className="opacity-50" />}

          <span className="truncate leading-none pt-1">
            {category.categorytitle || category.title}
          </span>
        </div>

        {hasChildren ? (
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown size={16} />
          </div>
        ) : (
          level > 0 && <ChevronRight size={14} className="opacity-40" />
        )}
      </div>

      {/* --- DROPDOWN ANIMATION --- */}
      <div 
        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pb-1">
          
          {/* 🟢 VIEW ALL BUTTON (Only inside Level 0) */}
          {/* Blue Border added via 'border-secondary' to match sub-categories */}
          {level === 0 && hasChildren && (
             <div 
                className={`
                  flex items-center gap-3 px-4 py-3 mt-2 cursor-pointer rounded-md
                  font-bold text-sm tracking-wide 
                  bg-white text-text-main shadow-sm border-l-4 border-secondary 
                  ml-4 md:ml-6
                  hover:bg-gray-50 transition-colors
                `}
                // onClick={() => {}} // Navigation logic removed for now as requested
             >
                <Eye size={16} className="text-primary" />
                <span>View All</span>
             </div>
          )}

          {/* Children List */}
          {hasChildren && category.children.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      </div>

    </div>
  );
};

// Tree Builder Helper
const buildCategoryTree = (categories) => {
  const categoryMap = {};
  const tree = [];
  categories.forEach(cat => {
    categoryMap[cat.id] = { ...cat, children: [] };
  });
  categories.forEach(cat => {
    if (cat.parentid && categoryMap[cat.parentid]) {
      categoryMap[cat.parentid].children.push(categoryMap[cat.id]);
    } else {
      tree.push(categoryMap[cat.id]);
    }
  });
  return tree;
};

export default Categories;