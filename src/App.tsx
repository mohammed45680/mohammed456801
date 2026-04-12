/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  ShoppingCart, 
  Package, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2,
  ChevronRight,
  Search,
  Filter,
  ArrowRightLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { SparePart, AssemblySlot, AssemblyConfig, MarketItem, Distributor } from './types';
import { SPARE_PARTS, ASSEMBLY_TEMPLATES } from './constants';
import { translations, Language } from './translations';

const generateAssemblyImage = async (imageUrls: string[]): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(imageUrls[0] || '');
      return;
    }

    canvas.width = 800;
    canvas.height = 600;

    // Fill background
    ctx.fillStyle = '#F5F5F4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const images = imageUrls.map(url => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      return img;
    });

    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      resolve('');
      return;
    }

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        // Draw images in a grid or row
        const padding = 40;
        const availableWidth = canvas.width - (padding * 2);
        const imgWidth = (availableWidth / totalImages) - 20;
        const imgHeight = canvas.height - (padding * 2);

        images.forEach((img, index) => {
          const x = padding + (index * (imgWidth + 20));
          const y = padding;
          
          // Draw a shadow/border for each part
          ctx.shadowColor = 'rgba(0,0,0,0.1)';
          ctx.shadowBlur = 20;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.roundRect(x, y, imgWidth, imgHeight, 20);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw image
          const aspect = img.width / img.height;
          let drawW = imgWidth - 40;
          let drawH = drawW / aspect;
          if (drawH > imgHeight - 40) {
            drawH = imgHeight - 40;
            drawW = drawH * aspect;
          }

          const dx = x + (imgWidth - drawW) / 2;
          const dy = y + (imgHeight - drawH) / 2;
          
          ctx.drawImage(img, dx, dy, drawW, drawH);
        });

        resolve(canvas.toDataURL('image/png'));
      }
    };

    images.forEach(img => {
      img.onload = onImageLoad;
      img.onerror = onImageLoad; // Continue even if one fails
    });
  });
};

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'assembly' | 'market' | 'distributors' | 'cart'>('catalog');
  const [selectedTemplate, setSelectedTemplate] = useState(ASSEMBLY_TEMPLATES[0]);
  const [assembly, setAssembly] = useState<AssemblySlot[]>(
    ASSEMBLY_TEMPLATES[0].slots.map(s => ({ ...s }))
  );
  const [parts, setParts] = useState<SparePart[]>(SPARE_PARTS);
  const [cart, setCart] = useState<SparePart[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assemblySearchQuery, setAssemblySearchQuery] = useState('');
  const [selectedAssemblyCategories, setSelectedAssemblyCategories] = useState<string[]>([]);
  const [selectedAssemblySizes, setSelectedAssemblySizes] = useState<number[]>([]);
  const [lastCompletedState, setLastCompletedState] = useState(false);

  const categories = useMemo(() => {
    return Array.from(new Set(parts.map(p => p.category)));
  }, [parts]);

  const allSizes = useMemo(() => {
    return Array.from(new Set(parts.map(p => p.size))).sort((a: number, b: number) => a - b);
  }, [parts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    parts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchesSearch = p.name.includes(searchQuery) || p.category.includes(searchQuery);
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => p.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [parts, searchQuery, selectedTags]);

  const filteredAssemblyParts = useMemo(() => {
    return parts.filter(p => {
      const matchesSearch = p.name.includes(assemblySearchQuery) || p.category.includes(assemblySearchQuery);
      const matchesCategory = selectedAssemblyCategories.length === 0 || selectedAssemblyCategories.includes(p.category);
      const matchesSize = selectedAssemblySizes.length === 0 || selectedAssemblySizes.includes(p.size);
      return matchesSearch && matchesCategory && matchesSize;
    });
  }, [parts, assemblySearchQuery, selectedAssemblyCategories, selectedAssemblySizes]);

  const isAssemblyComplete = assembly.every(s => s.currentPart !== undefined);

  // Notify when assembly is complete
  React.useEffect(() => {
    if (isAssemblyComplete && !lastCompletedState) {
      toast.success(t.toasts.assemblyComplete, {
        description: t.toasts.assemblyCompleteDesc,
        position: 'top-center'
      });
    }
    setLastCompletedState(isAssemblyComplete);
  }, [isAssemblyComplete, lastCompletedState]);

  const handleAddToAssembly = (slotId: string, part: SparePart) => {
    const slot = assembly.find(s => s.id === slotId);
    if (!slot) return;

    if (part.size !== slot.requiredSize) {
      toast.error(t.toasts.compatibilityError, {
        description: t.toasts.sizeMismatchDesc.replace('{req}', slot.requiredSize.toString()).replace('{sel}', part.size.toString()),
      });
      return;
    }

    if (part.category !== slot.allowedCategory) {
      toast.error(t.toasts.categoryError, {
        description: t.toasts.categoryMismatchDesc.replace('{req}', slot.allowedCategory),
      });
      return;
    }

    setAssembly(prev => prev.map(s => 
      s.id === slotId ? { ...s, currentPart: part } : s
    ));
    
    toast.success(t.toasts.addedToSlot, {
      description: t.toasts.addedToSlotDesc.replace('{name}', part.name),
    });
  };

  const removeFromAssembly = (slotId: string) => {
    setAssembly(prev => prev.map(s => 
      s.id === slotId ? { ...s, currentPart: undefined } : s
    ));
  };

  const updateSlotSize = (slotId: string, newSize: number) => {
    setAssembly(prev => prev.map(s => {
      if (s.id === slotId) {
        // Clear part if it's no longer compatible with the new size
        const currentPart = s.currentPart && s.currentPart.size === newSize ? s.currentPart : undefined;
        return { ...s, requiredSize: newSize, currentPart };
      }
      return s;
    }));
  };

  const addToCart = (part: SparePart) => {
    setCart(prev => [...prev, part]);
    toast.success(t.toasts.addedToCart);
  };

  const assembleForMarket = async () => {
    if (!isAssemblyComplete) return;

    const parts = assembly.map(s => s.currentPart!).filter(Boolean);
    const imageUrls = parts.map(p => p.image);
    
    toast.loading('جاري إنشاء صورة المعاينة...', { id: 'assembly-loading' });
    
    const compositeImage = await generateAssemblyImage(imageUrls);
    const totalPrice = parts.reduce((sum, p) => sum + p.price, 0);
    
    const newItem: MarketItem = {
      id: `m-${Date.now()}`,
      name: selectedTemplate.name,
      parts: parts,
      totalPrice: totalPrice,
      date: new Date().toLocaleDateString('ar-SA'),
      image: compositeImage
    };

    setMarketItems(prev => [newItem, ...prev]);
    setAssembly(selectedTemplate.slots.map(s => ({ ...s })));
    toast.dismiss('assembly-loading');
    toast.success(t.toasts.assembledForMarket, {
      description: t.toasts.assembledForMarketDesc.replace('{name}', newItem.name),
    });
    setActiveTab('market');
  };

  const addDistributor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDistributor: Distributor = {
      id: `d-${Date.now()}`,
      name: formData.get('name') as string,
      branchLocation: formData.get('branchLocation') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      email: formData.get('email') as string,
      marketingMethod: formData.get('marketingMethod') as string,
      deliveryMethod: formData.get('deliveryMethod') as string,
      paymentType: formData.get('paymentType') as string,
    };

    setDistributors(prev => [newDistributor, ...prev]);
    (e.target as HTMLFormElement).reset();
    toast.success(t.toasts.distributorAdded);
  };

  const addTagToPart = (partId: string, tag: string) => {
    if (!tag.trim()) return;
    setParts(prev => prev.map(p => {
      if (p.id === partId && !p.tags.includes(tag)) {
        return { ...p, tags: [...p.tags, tag] };
      }
      return p;
    }));
    toast.success(t.toasts.tagAdded);
  };

  const removeTagFromPart = (partId: string, tag: string) => {
    setParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, tags: p.tags.filter(t => t !== tag) };
      }
      return p;
    }));
  };

  return (
    <div className={`min-h-screen bg-[#F5F5F4] text-[#1A1A1A] font-sans ${language === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Toaster richColors closeButton />
      {/* Navigation */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#1A1A1A] p-2 rounded-lg">
                <Settings className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">{t.appName}</span>
            </div>
            
            <div className="hidden md:flex gap-8">
              {[
                { id: 'catalog', label: t.tabs.catalog, icon: Package },
                { id: 'assembly', label: t.tabs.assembly, icon: Wrench },
                { id: 'market', label: t.tabs.market, icon: ShoppingCart },
                { id: 'distributors', label: t.tabs.distributors, icon: Users },
                { id: 'cart', label: t.cart.title, icon: ShoppingCart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id ? 'text-[#1A1A1A]' : 'text-[#71717A] hover:text-[#1A1A1A]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#1A1A1A]"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="px-3 py-1.5 border border-[#E5E5E5] rounded-lg text-xs font-bold hover:bg-[#F5F5F4] transition-all"
              >
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
              <div className="relative cursor-pointer" onClick={() => setActiveTab('cart')}>
                <ShoppingCart className={`w-6 h-6 ${activeTab === 'cart' ? 'text-[#1A1A1A]' : 'text-[#71717A]'}`} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6321] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{t.catalog.title}</h1>
                  <p className="text-[#71717A] mt-1 text-sm">{t.catalog.subtitle}</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]`} />
                  <input
                    type="text"
                    placeholder={t.catalog.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5`}
                  />
                </div>
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-xs font-bold text-[#71717A] ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>{t.catalog.tagsLabel}</span>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-[#FF6321] text-white'
                          : 'bg-white border border-[#E5E5E5] text-[#71717A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button 
                      onClick={() => setSelectedTags([])}
                      className={`text-[10px] text-[#FF6321] font-bold hover:underline ${language === 'ar' ? 'mr-2' : 'ml-2'}`}
                    >
                      {t.catalog.clearAll}
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredParts.map((part) => (
                  <motion.div
                    key={part.id}
                    whileHover={{ y: -4 }}
                    className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden group"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-[#F5F5F4]">
                      <img 
                        src={part.image} 
                        alt={part.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {part.category}
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{part.name}</h3>
                        <span className="text-[#FF6321] font-bold">{part.price} {t.market.sar}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#71717A]">
                        <div className="flex items-center gap-1">
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>{t.catalog.size}: {part.size} {t.catalog.mm}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>{t.assembly.fullyCompatible}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#71717A] line-clamp-2 leading-relaxed">
                        {part.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {part.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F4] text-[#71717A] text-[9px] font-bold rounded-md group/tag"
                          >
                            {tag}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTagFromPart(part.id, tag);
                              }}
                              className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button 
                          onClick={() => {
                            const tag = prompt(language === 'ar' ? 'أدخل الوسم الجديد:' : 'Enter new tag:');
                            if (tag) addTagToPart(part.id, tag);
                          }}
                          className="px-2 py-0.5 border border-dashed border-[#E5E5E5] text-[#A1A1AA] text-[9px] font-bold rounded-md hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all"
                        >
                          + {t.catalog.addTag}
                        </button>
                      </div>

                      <button 
                        onClick={() => addToCart(part)}
                        className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {t.catalog.addToCart}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'assembly' && (
            <motion.div
              key="assembly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">{t.assembly.title}</h2>
                      <p className="text-[#71717A] text-sm">{t.assembly.subtitle}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">{t.assembly.templateLabel}</label>
                      <select 
                        className="bg-[#F5F5F4] border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-0"
                        onChange={(e) => {
                          const template = ASSEMBLY_TEMPLATES.find(t => t.id === e.target.value);
                          if (template) {
                            setSelectedTemplate(template);
                            setAssembly(template.slots.map(s => ({ ...s })));
                          }
                        }}
                      >
                        {ASSEMBLY_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assembly.map((slot) => (
                      <div 
                        key={slot.id}
                        className={`relative border-2 border-dashed rounded-3xl p-6 transition-all ${
                          slot.currentPart 
                            ? 'border-[#1A1A1A] bg-white' 
                            : 'border-[#E5E5E5] bg-[#F9F9F9]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                              {t.assembly.slotLabel} {slot.allowedCategory}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <label className="text-xs font-bold text-[#1A1A1A]">{t.assembly.requiredSize}</label>
                              <input 
                                type="number"
                                value={slot.requiredSize}
                                onChange={(e) => updateSlotSize(slot.id, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-white border border-[#E5E5E5] rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                              />
                            </div>
                          </div>
                          {slot.currentPart && (
                            <button 
                              onClick={() => removeFromAssembly(slot.id)}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {slot.currentPart ? (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-4"
                          >
                            <img 
                              src={slot.currentPart.image} 
                              className="w-20 h-20 rounded-2xl object-cover border border-[#E5E5E5]"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-sm">{slot.currentPart.name}</p>
                              <p className="text-[#FF6321] text-xs font-bold mt-0.5">{slot.currentPart.price} {t.market.sar}</p>
                              <p className="text-[10px] text-[#71717A] mt-1 line-clamp-2 leading-tight">
                                {slot.currentPart.description}
                              </p>
                              <div className="flex items-center gap-1 text-green-600 text-[10px] mt-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t.assembly.fullyCompatible}</span>
                              </div>
                              <button 
                                onClick={() => addToCart(slot.currentPart!)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold rounded-lg hover:bg-[#333] transition-colors"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                {t.assembly.addToCart}
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-20 flex items-center justify-center text-[#A1A1AA] text-sm italic">
                            {t.assembly.waitingPart}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isAssemblyComplete && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-6 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 text-green-800">
                        <div className="bg-green-500 p-2 rounded-full text-white">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">{t.assembly.assemblySuccess}</p>
                          <p className="text-sm opacity-80">{t.assembly.assemblySuccessDesc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={assembleForMarket}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                      >
                        {t.assembly.assembleForMarket}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      {t.assembly.compatibleParts}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedAssemblyCategories(prev => 
                            prev.includes(category) 
                              ? prev.filter(c => c !== category) 
                              : [...prev, category]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          selectedAssemblyCategories.includes(category)
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-[#F5F5F4] text-[#71717A] hover:bg-[#E5E5E5]'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 border-t border-[#F5F5F4] pt-4">
                    <span className="text-[10px] font-bold text-[#71717A] w-full mb-1">{t.assembly.sizeFilter}</span>
                    {allSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedAssemblySizes(prev => 
                            prev.includes(size) 
                              ? prev.filter(s => s !== size) 
                              : [...prev, size]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          selectedAssemblySizes.includes(size)
                            ? 'bg-[#FF6321] text-white'
                            : 'bg-[#F5F5F4] text-[#71717A] hover:bg-[#E5E5E5]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A]`} />
                    <input
                      type="text"
                      placeholder={t.assembly.searchParts}
                      value={assemblySearchQuery}
                      onChange={(e) => setAssemblySearchQuery(e.target.value)}
                      className={`w-full ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-[#F5F5F4] border-none rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/10`}
                    />
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredAssemblyParts.map((part) => (
                      <div 
                        key={part.id}
                        className="group p-3 border border-[#E5E5E5] rounded-2xl hover:border-[#1A1A1A] transition-all cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <img 
                            src={part.image} 
                            className="w-14 h-14 rounded-xl object-cover"
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{part.name}</p>
                            <p className="text-[10px] text-[#71717A]">{part.category} • {part.size} {t.catalog.mm}</p>
                            <div className="mt-2 flex gap-1">
                              {assembly.map(slot => (
                                <button
                                  key={slot.id}
                                  disabled={part.size !== slot.requiredSize || part.category !== slot.allowedCategory}
                                  onClick={() => handleAddToAssembly(slot.id, part)}
                                  className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                                    part.size === slot.requiredSize && part.category === slot.allowedCategory
                                      ? 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                                      : 'bg-[#F5F5F4] text-[#A1A1AA] cursor-not-allowed'
                                  }`}
                                >
                                  {language === 'ar' ? 'تركيب في' : 'Install in'} {slot.id === 's1' ? '1' : '2'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{t.market.title}</h2>
                  <p className="text-[#71717A] mt-1">{t.market.subtitle}</p>
                </div>
                <button className="px-6 py-3 bg-[#FF6321] text-white rounded-2xl font-bold shadow-lg shadow-[#FF6321]/20 hover:scale-105 transition-transform">
                  {language === 'ar' ? 'عرض قطعة للبيع' : 'List Item for Sale'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6">
                    <h3 className="font-bold text-xl mb-6">{language === 'ar' ? 'أحدث العروض' : 'Latest Offers'}</h3>
                    <div className="space-y-4">
                      {marketItems.length === 0 && (
                        <div className="text-center py-12 text-[#71717A] italic">
                          {t.market.emptyMarket}
                        </div>
                      )}
                      {marketItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-6 p-4 border border-[#F5F5F4] rounded-2xl hover:bg-[#F9F9F9] transition-colors group">
                          <img 
                            src={item.image} 
                            className="w-24 h-24 rounded-2xl object-cover"
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-bold text-lg">{item.name}</h4>
                              <span className="text-[#FF6321] font-bold">{item.totalPrice} {t.market.sar}</span>
                            </div>
                            <p className="text-sm text-[#71717A] mt-1">{language === 'ar' ? 'وحدة مجمعة من' : 'Assembled unit with'} {item.parts.length} {t.market.partsCount}. {language === 'ar' ? 'التاريخ:' : 'Date:'} {item.date}</p>
                            <div className="flex items-center gap-4 mt-4">
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold uppercase">{language === 'ar' ? 'وحدة مجمعة' : 'Assembled Unit'}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold uppercase">{language === 'ar' ? 'شحن مجاني' : 'Free Shipping'}</span>
                            </div>
                          </div>
                          <button className="p-3 bg-[#F5F5F4] group-hover:bg-[#1A1A1A] group-hover:text-white rounded-xl transition-all">
                            <ChevronRight className={`w-5 h-5 ${language === 'en' ? 'rotate-0' : 'rotate-180'}`} />
                          </button>
                        </div>
                      ))}
                      {/* Static placeholder offers */}
                      {[1, 2].map((i) => (
                        <div key={`static-${i}`} className="flex items-center gap-6 p-4 border border-[#F5F5F4] rounded-2xl hover:bg-[#F9F9F9] transition-colors group opacity-60">
                          <img 
                            src={`https://picsum.photos/seed/market${i}/200/200`} 
                            className="w-24 h-24 rounded-2xl object-cover"
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-bold text-lg">{language === 'ar' ? `وحدة نقل حركة متكاملة #${i}` : `Integrated Transmission Unit #${i}`}</h4>
                              <span className="text-[#FF6321] font-bold">1,200 {t.market.sar}</span>
                            </div>
                            <p className="text-sm text-[#71717A] mt-1">{language === 'ar' ? 'تم تجميعها واختبار توافقها بنجاح.' : 'Successfully assembled and compatibility tested.'}</p>
                            <div className="flex items-center gap-4 mt-4">
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold uppercase">{language === 'ar' ? 'جديد' : 'New'}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold uppercase">{language === 'ar' ? 'شحن مجاني' : 'Free Shipping'}</span>
                            </div>
                          </div>
                          <button className="p-3 bg-[#F5F5F4] group-hover:bg-[#1A1A1A] group-hover:text-white rounded-xl transition-all">
                            <ChevronRight className={`w-5 h-5 ${language === 'en' ? 'rotate-0' : 'rotate-180'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#1A1A1A] text-white rounded-3xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? 'احصائيات السوق' : 'Market Stats'}</h3>
                      <p className="text-white/60 text-sm mb-8">{language === 'ar' ? 'متابعة حركة البيع والشراء' : 'Track sales and purchase activity'}</p>
                      
                      <div className="space-y-6">
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</p>
                          <p className="text-3xl font-light tracking-tight">45,200 {t.market.sar}</p>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/40 text-xs mb-1">{language === 'ar' ? 'قطع مباعة' : 'Sold Parts'}</p>
                            <p className="text-xl font-bold">128</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1">{language === 'ar' ? 'طلبات نشطة' : 'Active Orders'}</p>
                            <p className="text-xl font-bold">12</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                  </div>

                  <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6">
                    <h3 className="font-bold mb-4">{language === 'ar' ? 'التصنيفات الأكثر طلباً' : 'Most Requested Categories'}</h3>
                    <div className="space-y-3">
                      {(language === 'ar' ? ['المحركات', 'التروس', 'الأنظمة الهيدروليكية', 'الإلكترونيات'] : ['Motors', 'Gears', 'Hydraulic Systems', 'Electronics']).map((cat, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-[#F9F9F9] rounded-xl">
                          <span className="text-sm font-medium">{cat}</span>
                          <span className="text-xs text-[#71717A] font-bold">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.cart.title}</h1>
                <p className="text-[#71717A] mt-1 text-sm">{language === 'ar' ? 'إدارة مشترياتك وقطع الغيار المختارة' : 'Manage your purchases and selected parts'}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {cart.length === 0 ? (
                    <div className="bg-white border border-[#E5E5E5] rounded-3xl p-12 text-center text-[#71717A] italic">
                      {t.cart.empty}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden">
                      <div className="divide-y divide-[#E5E5E5]">
                        {cart.map((item, idx) => (
                          <div key={`${item.id}-${idx}`} className="p-6 flex items-center gap-6 hover:bg-[#F9F9F9] transition-colors">
                            <img 
                              src={item.image} 
                              className="w-20 h-20 rounded-2xl object-cover border border-[#E5E5E5]"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{item.name}</h4>
                              <p className="text-sm text-[#71717A]">{item.category} • {item.size} {t.catalog.mm}</p>
                              <p className="text-[#FF6321] font-bold mt-1">{item.price} {t.market.sar}</p>
                            </div>
                            <button 
                              onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 sticky top-24">
                    <h3 className="font-bold text-xl mb-6">{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#71717A]">{language === 'ar' ? 'عدد القطع' : 'Parts Count'}</span>
                        <span className="font-bold">{cart.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#71717A]">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                        <span className="text-green-600 font-bold">{language === 'ar' ? 'مجاني' : 'Free'}</span>
                      </div>
                      <div className="h-px bg-[#F5F5F4] my-4" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t.cart.total}</span>
                        <span className="text-[#FF6321]">{cart.reduce((acc, item) => acc + item.price, 0)} {t.market.sar}</span>
                      </div>
                      <button 
                        disabled={cart.length === 0}
                        onClick={() => {
                          toast.success(language === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Order sent successfully!');
                          setCart([]);
                        }}
                        className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold hover:bg-[#333] transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.cart.checkout}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'distributors' && (
            <motion.div
              key="distributors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{t.distributors.title}</h1>
                  <p className="text-[#71717A] mt-1 text-sm">{t.distributors.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Distributor Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sticky top-24">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-[#FF6321]" />
                      {t.distributors.newDistributor}
                    </h3>
                    <form onSubmit={addDistributor} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.name}</label>
                        <input name="name" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10" placeholder={language === 'ar' ? 'أدخل الاسم...' : 'Enter name...'} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.branch}</label>
                        <input name="branchLocation" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10" placeholder={language === 'ar' ? 'المدينة، الحي...' : 'City, District...'} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.phone}</label>
                          <input name="phoneNumber" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10" placeholder="05xxxxxxxx" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.email}</label>
                          <input name="email" type="email" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10" placeholder="example@mail.com" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.marketing}</label>
                        <select name="marketingMethod" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10">
                          <option value="وسائل التواصل">{language === 'ar' ? 'وسائل التواصل' : 'Social Media'}</option>
                          <option value="إعلانات ممولة">{language === 'ar' ? 'إعلانات ممولة' : 'Paid Ads'}</option>
                          <option value="تسويق مباشر">{language === 'ar' ? 'تسويق مباشر' : 'Direct Marketing'}</option>
                          <option value="شركاء نجاح">{language === 'ar' ? 'شركاء نجاح' : 'Success Partners'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.delivery}</label>
                        <select name="deliveryMethod" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10">
                          <option value="شحن سريع">{language === 'ar' ? 'شحن سريع' : 'Fast Shipping'}</option>
                          <option value="استلام من الفرع">{language === 'ar' ? 'استلام من الفرع' : 'Branch Pickup'}</option>
                          <option value="مندوب خاص">{language === 'ar' ? 'مندوب خاص' : 'Private Courier'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#71717A] mb-1.5 uppercase tracking-wider">{t.distributors.payment}</label>
                        <select name="paymentType" required className="w-full px-4 py-2.5 bg-[#F5F5F4] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]/10">
                          <option value="نقدي">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                          <option value="بطاقة ائتمان">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                          <option value="تحويل بنكي">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                          <option value="دفع عند الاستلام">{language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery'}</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-[#333] transition-all mt-4">
                        {t.distributors.save}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Distributors Table */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className={`w-full border-collapse ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <thead>
                          <tr className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                            <th className="px-6 py-4 text-xs font-bold text-[#71717A] uppercase tracking-wider">{language === 'ar' ? 'الموزع' : 'Distributor'}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#71717A] uppercase tracking-wider">{language === 'ar' ? 'الموقع والتواصل' : 'Location & Contact'}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#71717A] uppercase tracking-wider">{language === 'ar' ? 'التسويق والشحن' : 'Marketing & Shipping'}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#71717A] uppercase tracking-wider">{t.distributors.payment}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#71717A] uppercase tracking-wider">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E5]">
                          {distributors.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-20 text-center text-[#71717A] italic">
                                {t.distributors.emptyList}
                              </td>
                            </tr>
                          ) : (
                            distributors.map((dist) => (
                              <tr key={dist.id} className="hover:bg-[#F9F9F9] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center font-bold">
                                      {dist.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-sm">{dist.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                                      <MapPin className="w-3 h-3" />
                                      {dist.branchLocation}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                                      <Phone className="w-3 h-3" />
                                      {dist.phoneNumber}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                                      <Mail className="w-3 h-3" />
                                      {dist.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                      <Share2 className="w-3 h-3 text-[#FF6321]" />
                                      {dist.marketingMethod}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                      <Truck className="w-3 h-3 text-blue-500" />
                                      {dist.deliveryMethod}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">
                                    <CreditCard className="w-3 h-3" />
                                    {dist.paymentType}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => setDistributors(prev => prev.filter(d => d.id !== dist.id))}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E5] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-[#1A1A1A] p-2 rounded-lg">
                  <Settings className="text-white w-5 h-5" />
                </div>
                <span className="text-lg font-bold">{t.appName}</span>
              </div>
              <p className="text-[#71717A] text-sm max-w-xs leading-relaxed">
                {language === 'ar' 
                  ? 'المنصة الرائدة في الشرق الأوسط لتجميع وتداول قطع الغيار الصناعية بدقة واحترافية عالية.'
                  : 'The leading platform in the Middle East for assembling and trading industrial spare parts with high precision and professionalism.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{language === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h4>
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li><a href="#" className="hover:text-[#1A1A1A]">{language === 'ar' ? 'عن المنصة' : 'About Platform'}</a></li>
                <li><a href="#" className="hover:text-[#1A1A1A]">{language === 'ar' ? 'كيفية التجميع' : 'How to Assemble'}</a></li>
                <li><a href="#" className="hover:text-[#1A1A1A]">{language === 'ar' ? 'سياسة البيع' : 'Sales Policy'}</a></li>
                <li><a href="#" className="hover:text-[#1A1A1A]">{language === 'ar' ? 'الدعم الفني' : 'Technical Support'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h4>
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li>info@technopart.com</li>
                <li>+966 500 000 000</li>
                <li>{language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#F5F5F4] mt-12 pt-8 text-center text-xs text-[#A1A1AA]">
            © 2026 {t.appName}. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
