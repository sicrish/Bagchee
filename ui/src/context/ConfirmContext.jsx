import React, { createContext, useState, useContext } from 'react';

// 1. Context Create kiya
const ConfirmContext = createContext();

// 2. Custom Hook
export const useConfirm = () => {
  return useContext(ConfirmContext);
};

// 3. Provider Component
export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState(null); // Promise resolve karne ke liye
  const [config, setConfig] = useState({ title: '', message: '' });

  // 🟢 NAYA ASYNC CONFIRM FUNCTION
  const confirm = (title = "Are you sure?", message = "Do you really want to delete this?") => {
    setConfig({ title, message });
    setIsOpen(true);
    
    // Ye Promise return karega, jisse code wahin ruk jayega jab tak user click na kare
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true); // User ne Yes dabaya (returns true)
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false); // User ne No dabaya (returns false)
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* 🟢 THEME MATCHED MODAL UI */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-text-main/60 backdrop-blur-sm transition-opacity">
          <div className="bg-cream-100 rounded-lg shadow-2xl w-full max-w-[320px] mx-4 p-6 animate-fadeIn">
            
            <div className="text-center">
              {/* Headings using Outfit (font-display) and text-main */}
              <h3 className="text-lg font-bold text-text-main mb-1 font-display">
                {config.title}
              </h3>
              
              {/* Message using Roboto (font-body) and text-muted */}
              <p className="text-sm text-text-muted mb-6 font-body">
                {config.message}
              </p>
              
             {/* Slick Yes/No Buttons */}
              <div className="flex w-full gap-3">
                
                {/* YES Button: Primary Text, Hover Red Background */}
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-white border border-primary text-primary hover:bg-red-600 hover:border-red-600 hover:text-white text-xs font-bold font-montserrat rounded-md transition-all shadow-sm uppercase tracking-wider active:scale-95"
                >
                  Yes
                </button>
                
                {/* NO Button: Cream-200, Hover Cream-50 */}
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-cream-200 hover:bg-cream-50 text-text-main text-xs font-bold font-montserrat rounded-md transition-all uppercase tracking-wider active:scale-95"
                >
                  No
                </button>
                
              </div>
            </div>

          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};