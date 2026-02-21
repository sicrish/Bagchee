import React from 'react';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';

const ProductModal = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  // Decide which image to show in Preview (Priority: TOC > Sample > Default)
  const previewImage = product.toc_image 
    ? `${process.env.REACT_APP_API_URL}${product.toc_image}`
    : `${process.env.REACT_APP_API_URL}${product.default_image}`;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
        {/* Backdrop */}
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all font-body relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-text-main transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row h-[80vh] md:h-[600px]">
                    
                    {/* LEFT: PREVIEW IMAGE (Scrollable) */}
                    <div className="w-full md:w-1/2 bg-gray-50 overflow-y-auto custom-scrollbar border-r border-gray-100 p-4 flex items-start justify-center">
                        <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="max-w-full h-auto shadow-sm"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/500x700?text=No+Preview+Available" }}
                        />
                    </div>

                    {/* RIGHT: DETAILS */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <h2 className="text-2xl font-display font-bold text-text-main mb-2">
                                {product.title}
                            </h2>
                            <p className="text-sm font-semibold text-primary mb-4">
                                By {product.author?.first_name} {product.author?.last_name}
                            </p>

                            <div className="text-3xl font-bold text-text-main font-montserrat mb-6">
                                ₹{product.price}
                                {product.real_price > product.price && (
                                    <span className="ml-3 text-lg font-normal text-gray-400 line-through">₹{product.real_price}</span>
                                )}
                            </div>

                            {/* Key Features */}
                            <div className="space-y-3 mb-6 bg-cream-50 p-4 rounded-lg border border-cream-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">ISBN:</span>
                                    <span className="font-bold text-text-main">{product.isbn13}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Format:</span>
                                    <span className="font-bold text-text-main capitalize">{product.binding || 'Paperback'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Language:</span>
                                    <span className="font-bold text-text-main">{product.language}</span>
                                </div>
                            </div>

                            <p className="text-sm text-text-muted leading-relaxed mb-6">
                                <span dangerouslySetInnerHTML={{ __html: product.synopsis?.slice(0, 300) }} />...
                            </p>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                            <button className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all">
                                <ShoppingCart size={20} /> Add to Cart
                            </button>
                            <div className="flex gap-3">
                                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-main py-3 rounded-lg font-bold uppercase text-sm transition-colors">
                                    View Full Details
                                </button>
                                <button className="px-4 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                                    <Heart size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProductModal;