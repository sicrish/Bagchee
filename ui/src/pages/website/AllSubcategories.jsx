'use client';

import React, { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; // 🟢 React Query Import

const AllSubcategories = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Helper function to build tree (No changes)
  const buildCategoryTree = (categories) => {
    const map = {};
    const tree = [];
    categories.forEach((c) => (map[c._id] = { ...c, children: [] }));
    categories.forEach((c) => {
      if (c.parentid && map[c.parentid]) map[c.parentid].children.push(map[c._id]);
      else tree.push(map[c._id]);
    });
    return tree;
  };

  // Helper to find category (No changes)
  const findCategoryBySlug = (categories, targetSlug) => {
    for (const cat of categories) {
      if (cat.slug === targetSlug) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryBySlug(cat.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };

  // 🟢 1. FETCH CATEGORIES & SUBCATEGORIES (useQuery)
  const { data, isLoading: loading } = useQuery({
    queryKey: ['category-tree-with-sub', slug],
    queryFn: async () => {
      const [catRes, subcatRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`),
        axios.get(`${process.env.REACT_APP_API_URL}/subcategory/fetch`)
      ]);

      if (catRes.data.status && subcatRes.data.status) {
        const allCategories = buildCategoryTree(catRes.data.data);
        const allSubcategories = subcatRes.data.data;
        
        const foundCategory = findCategoryBySlug(allCategories, slug);
        
        if (foundCategory) {
          const filteredSubcategories = allSubcategories.filter((subcat) => {
            const catId = subcat.categoryId || subcat.categoryid || subcat.category_id || subcat.category;
            const catIdStr = typeof catId === 'object' ? catId._id : catId;
            return String(catIdStr) === String(foundCategory._id);
          });
          
          return { category: foundCategory, subcategories: filteredSubcategories };
        }
      }
      return { category: null, subcategories: [] };
    },
    staleTime: 1000 * 60 * 10, // 10 minute tak data fresh rahega
  });

  const category = data?.category;
  const subcategories = data?.subcategories || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted font-medium">Loading subcategories...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
          <Link
            to="/books"
            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-medium inline-block"
          >
            Browse All Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/books/${slug}`} className="hover:text-primary transition-colors">
              {category.categorytitle || category.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">All Subcategories</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:underline mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {category.categorytitle || category.title}
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
            All Subcategories
          </h1>
          <p className="text-gray-600">
            Explore all {subcategories.length} subcategories under{" "}
            <span className="font-semibold">{category.categorytitle || category.title}</span>
          </p>
        </div>

        {/* Subcategories Grid */}
        {subcategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategories.map((subcat) => (
              <Link
                key={subcat._id}
                to={`/books/${slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  // Navigate back to category page with this subcategory selected
                  navigate(`/books/${slug}`, { 
                    state: { selectedSubcategoryId: subcat._id } 
                  });
                }}
                className="bg-cream-100 border-2 border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-md transition-all group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors mb-2">
                  {subcat.subcategoryname}
                </h3>
                {subcat.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {subcat.description}
                  </p>
                )}
                <div className="mt-4 flex items-center text-primary text-sm font-medium">
                  <span>View Books</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-cream-100 border border-gray-200 rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Subcategories Found
              </h3>
              <p className="text-gray-600 mb-4">
                This category doesn't have any subcategories yet.
              </p>
              <Link
                to={`/books/${slug}`}
                className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-medium inline-block"
              >
                Browse {category.categorytitle || category.title} Books
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSubcategories;