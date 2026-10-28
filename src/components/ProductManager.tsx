import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  Package,
  DollarSign,
  AlertCircle,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
  Upload,
  Camera,
  Smartphone,
  Laptop,
  Cloud,
  Loader2,
  Sparkles,
  Layers,
  Folder,
  ImagePlus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Product, StoreConfig, CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES } from '../data/initialProducts';
import { formatUSD, formatSecondary } from '../utils/currency';
import { optimizeImageFile } from '../utils/imageOptimizer';

interface ProductManagerProps {
  products: Product[];
  config: StoreConfig;
  onAddProduct: (productData: Partial<Product>) => Promise<any>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<any>;
  onDeleteProduct: (id: string) => Promise<any>;
  onUpdateConfig?: (updates: Partial<StoreConfig>) => Promise<any>;
}

// Preset supermarket photo choices for quick selection
const PRESET_IMAGES = [
  { name: 'Harina P.A.N. 1kg', url: '/src/assets/images/harina_pan_1792624719412.jpg' },
  { name: 'Arroz Blanco 1kg', url: '/src/assets/images/arroz_grano_1792624719746.jpg' },
  { name: 'Pasta Spaghetti 1kg', url: '/src/assets/images/pasta_spaghetti_1792624748145.jpg' },
  { name: 'Aceite Vegetal 1L', url: '/src/assets/images/aceite_maiz_1792624762254.jpg' },
  { name: 'Café Molido 500g', url: '/src/assets/images/cafe_molido_1792624733974.jpg' },
  { name: 'Leche en Polvo 900g', url: '/src/assets/images/leche_polvo_1792624749238.jpg' },
  { name: 'Queso Llanero 500g', url: '/src/assets/images/queso_fresco_1792624762755.jpg' },
  { name: 'Atún en Lata 140g', url: '/src/assets/images/atun_lata_1792624778484.jpg' },
  { name: 'Mayonesa Cremosa 400g', url: '/src/assets/images/mayonesa_frasco_1792624778564.jpg' }
];

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  config,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateConfig
}) => {
  // Navigation between Products & Categories
  const [managerTab, setManagerTab] = useState<'products' | 'categories'>('products');

  // Modal states for products
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick inline price & stock edits map: productId -> string value
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [savedFeedbacks, setSavedFeedbacks] = useState<Record<string, boolean>>({});

  // Product search in manager table
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // New product form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Víveres & Despensa');
  const [customNewCatInput, setCustomNewCatInput] = useState('');
  const [newPriceUSD, setNewPriceUSD] = useState('');
  const [newStock, setNewStock] = useState('20');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState(PRESET_IMAGES[0].url);
  const [newBadge, setNewBadge] = useState('Más Vendido');
  const [newFeatures, setNewFeatures] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isProcessingAddImage, setIsProcessingAddImage] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit product form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [customEditCatInput, setCustomEditCatInput] = useState('');
  const [editPriceUSD, setEditPriceUSD] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editFeatures, setEditFeatures] = useState('');
  const [editSku, setEditSku] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isProcessingEditImage, setIsProcessingEditImage] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  // --- Category Management State ---
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState<string | null>(null);
  const [categoryErrorMsg, setCategoryErrorMsg] = useState<string | null>(null);

  // Category Edit Form State
  const [catNameInput, setCatNameInput] = useState('');
  const [catImageInput, setCatImageInput] = useState('');
  const [catBadgeInput, setCatBadgeInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');
  const [catUpdateProducts, setCatUpdateProducts] = useState(true);
  const [isProcessingCatImage, setIsProcessingCatImage] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatBadge, setNewCatBadge] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isProcessingNewCatImage, setIsProcessingNewCatImage] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Resolved list of categories merging config.categories, defaults, and products
  const activeCategories: CategoryConfig[] = useMemo(() => {
    const list: CategoryConfig[] = config.categories && config.categories.length > 0
      ? [...config.categories]
      : [...DEFAULT_CATEGORIES];

    // Ensure any category found in products is represented in the list
    products.forEach((prod) => {
      if (prod.category && !list.some((c) => c.name.toLowerCase() === prod.category.toLowerCase())) {
        list.push({
          id: prod.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: prod.category,
          imageUrl: '',
          description: `Departamento de ${prod.category}`,
          badgeText: prod.category,
          color: 'from-emerald-600 to-teal-700'
        });
      }
    });

    return list;
  }, [config.categories, products]);

  // Product Image Upload handlers
  const handleUploadNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAddImage(true);
    setAddFormError('');
    try {
      const optimized = await optimizeImageFile(file, 900, 0.85);
      setNewImage(optimized);
    } catch (err: any) {
      setAddFormError(err.message || 'Error al procesar la imagen del producto.');
    } finally {
      setIsProcessingAddImage(false);
    }
  };

  const handleUploadEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingEditImage(true);
    setEditFormError('');
    try {
      const optimized = await optimizeImageFile(file, 900, 0.85);
      setEditImage(optimized);
    } catch (err: any) {
      setEditFormError(err.message || 'Error al procesar la imagen del producto.');
    } finally {
      setIsProcessingEditImage(false);
    }
  };

  // Open Edit Modal for a Product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setCustomEditCatInput('');
    setEditPriceUSD(product.priceUSD.toString());
    setEditStock(product.stock.toString());
    setEditDescription(product.description || '');
    setEditImage(product.image);
    setEditBadge(product.badge || '');
    setEditSku(product.sku || '');
    setEditFeatures(product.features ? product.features.join('\n') : '');
    setEditFormError('');
  };

  const handleCloseEditModal = () => {
    setEditingProduct(null);
    setEditFormError('');
  };

  // Quick price save
  const handleSavePrice = async (product: Product) => {
    const rawVal = priceEdits[product.id];
    if (rawVal === undefined) return;
    const parsed = parseFloat(rawVal);
    if (isNaN(parsed) || parsed <= 0) return;

    try {
      await onUpdateProduct(product.id, { priceUSD: parsed });
      setSavedFeedbacks((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setSavedFeedbacks((prev) => ({ ...prev, [product.id]: false }));
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Error al guardar precio');
    }
  };

  // Quick stock save
  const handleSaveStock = async (product: Product) => {
    const rawVal = stockEdits[product.id];
    if (rawVal === undefined) return;
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 0) return;

    try {
      await onUpdateProduct(product.id, { stock: parsed });
      setSavedFeedbacks((prev) => ({ ...prev, [`stock-${product.id}`]: true }));
      setTimeout(() => {
        setSavedFeedbacks((prev) => ({ ...prev, [`stock-${product.id}`]: false }));
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Error al guardar stock');
    }
  };

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddFormError('Por favor ingresa el nombre del producto.');
      return;
    }
    const priceNum = parseFloat(newPriceUSD);
    if (isNaN(priceNum) || priceNum <= 0) {
      setAddFormError('Ingresa un precio válido en USD (mayor a 0).');
      return;
    }

    const finalCat = newCategory === '__custom__' ? customNewCatInput.trim() : newCategory.trim();
    if (!finalCat) {
      setAddFormError('Por favor selecciona o escribe la categoría del producto.');
      return;
    }

    setAddFormError('');
    setIsSubmittingAdd(true);

    try {
      const featArray = newFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      await onAddProduct({
        name: newName.trim(),
        category: finalCat,
        priceUSD: priceNum,
        stock: parseInt(newStock, 10) >= 0 ? parseInt(newStock, 10) : 20,
        description: newDescription.trim() || 'Producto disponible en el catálogo 24/7.',
        image: newImage.trim() || PRESET_IMAGES[0].url,
        badge: newBadge.trim() || undefined,
        features: featArray.length > 0 ? featArray : ['Producto garantizado', 'Despacho inmediato']
      });

      // If user typed a new category that wasn't in activeCategories, also register it in config.categories
      if (
        onUpdateConfig &&
        !activeCategories.some((c) => c.name.toLowerCase() === finalCat.toLowerCase())
      ) {
        const newCatObj: CategoryConfig = {
          id: finalCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: finalCat,
          imageUrl: newImage.trim(),
          description: `Departamento de ${finalCat}`,
          badgeText: finalCat,
          color: 'from-emerald-600 to-teal-700'
        };
        onUpdateConfig({ categories: [...activeCategories, newCatObj] });
      }

      setNewName('');
      setNewPriceUSD('');
      setNewDescription('');
      setNewFeatures('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddFormError(err.message || 'Error al crear producto');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Product Submit
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editName.trim()) {
      setEditFormError('Por favor ingresa el nombre del producto.');
      return;
    }
    const priceNum = parseFloat(editPriceUSD);
    if (isNaN(priceNum) || priceNum <= 0) {
      setEditFormError('Ingresa un precio válido en USD (mayor a 0).');
      return;
    }

    const finalCat = editCategory === '__custom__' ? customEditCatInput.trim() : editCategory.trim();
    if (!finalCat) {
      setEditFormError('Por favor selecciona o escribe la categoría del producto.');
      return;
    }

    setEditFormError('');
    setIsSubmittingEdit(true);

    try {
      const featArray = editFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const updates: Partial<Product> = {
        name: editName.trim(),
        category: finalCat,
        priceUSD: priceNum,
        stock: parseInt(editStock, 10) >= 0 ? parseInt(editStock, 10) : 0,
        description: editDescription.trim(),
        image: editImage.trim() || PRESET_IMAGES[0].url,
        badge: editBadge.trim() || undefined,
        sku: editSku.trim() || editingProduct.sku,
        features: featArray.length > 0 ? featArray : editingProduct.features
      };

      await onUpdateProduct(editingProduct.id, updates);

      // Clean local price edits for this product so table displays new saved value
      setPriceEdits((prev) => {
        const copy = { ...prev };
        delete copy[editingProduct.id];
        return copy;
      });
      setStockEdits((prev) => {
        const copy = { ...prev };
        delete copy[editingProduct.id];
        return copy;
      });

      handleCloseEditModal();
    } catch (err: any) {
      setEditFormError(err.message || 'Error al actualizar el producto');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${name}" del catálogo? Esta acción no se puede deshacer.`)) {
      try {
        await onDeleteProduct(id);
      } catch (err: any) {
        alert(err.message || 'Error al eliminar');
      }
    }
  };

  // ==========================================
  // --- Category Actions & Logo Handlers ---
  // ==========================================

  const handleOpenEditCategory = (cat: CategoryConfig) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatImageInput(cat.imageUrl || '');
    setCatBadgeInput(cat.badgeText || '');
    setCatDescInput(cat.description || '');
    setCatUpdateProducts(true);
    setCategoryErrorMsg(null);
  };

  const handleCloseEditCategory = () => {
    setEditingCategory(null);
    setCategoryErrorMsg(null);
  };

  // Upload category logo file from camera/gallery
  const handleUploadCategoryLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingCatImage(true);
    setCategoryErrorMsg(null);
    try {
      // Optimize to square logo icon ~400x400
      const optimized = await optimizeImageFile(file, 400, 0.85);
      setCatImageInput(optimized);
    } catch (err: any) {
      setCategoryErrorMsg(err.message || 'Error al optimizar el logo de la categoría.');
    } finally {
      setIsProcessingCatImage(false);
    }
  };

  const handleUploadNewCatLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingNewCatImage(true);
    setCategoryErrorMsg(null);
    try {
      const optimized = await optimizeImageFile(file, 400, 0.85);
      setNewCatImage(optimized);
    } catch (err: any) {
      setCategoryErrorMsg(err.message || 'Error al optimizar el logo.');
    } finally {
      setIsProcessingNewCatImage(false);
    }
  };

  // Save changes to an existing category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !onUpdateConfig) return;

    const trimmedName = catNameInput.trim();
    if (!trimmedName) {
      setCategoryErrorMsg('El nombre de la categoría no puede estar vacío.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryErrorMsg(null);

    try {
      const oldName = editingCategory.name;
      const isNameChanged = oldName.toLowerCase() !== trimmedName.toLowerCase();

      // 1. Build updated categories list
      const updatedList = activeCategories.map((c) => {
        if (c.id === editingCategory.id || c.name.toLowerCase() === oldName.toLowerCase()) {
          return {
            ...c,
            name: trimmedName,
            imageUrl: catImageInput.trim(),
            badgeText: catBadgeInput.trim() || trimmedName,
            description: catDescInput.trim() || `Productos de ${trimmedName}`
          };
        }
        return c;
      });

      // 2. Persist categories to Google Cloud Firestore (storeConfig/main)
      await onUpdateConfig({ categories: updatedList });

      // 3. If name changed and user opted in, update all products with old category name
      if (isNameChanged && catUpdateProducts) {
        const affectedProducts = products.filter(
          (p) => p.category.toLowerCase() === oldName.toLowerCase()
        );
        for (const prod of affectedProducts) {
          await onUpdateProduct(prod.id, { category: trimmedName });
        }
      }

      setCategorySuccessMsg(`¡Categoría "${trimmedName}" y su logo fueron guardados exitosamente!`);
      setTimeout(() => setCategorySuccessMsg(null), 3500);
      handleCloseEditCategory();
    } catch (err: any) {
      setCategoryErrorMsg(err.message || 'Error al guardar la categoría.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Create a brand new category with custom logo
  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateConfig) return;

    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setCategoryErrorMsg('Por favor escribe el nombre de la nueva categoría.');
      return;
    }

    if (activeCategories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setCategoryErrorMsg(`Ya existe una categoría llamada "${trimmedName}".`);
      return;
    }

    setIsCreatingCategory(true);
    setCategoryErrorMsg(null);

    try {
      const newCatObj: CategoryConfig = {
        id: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: trimmedName,
        imageUrl: newCatImage.trim(),
        badgeText: newCatBadge.trim() || trimmedName,
        description: newCatDesc.trim() || `Productos y víveres de ${trimmedName}`,
        color: 'from-emerald-600 to-teal-700'
      };

      const updatedList = [...activeCategories, newCatObj];
      await onUpdateConfig({ categories: updatedList });

      setNewCatName('');
      setNewCatImage('');
      setNewCatBadge('');
      setNewCatDesc('');
      setIsAddCategoryModalOpen(false);

      setCategorySuccessMsg(`¡Nueva categoría "${trimmedName}" creada con su logo oficial!`);
      setTimeout(() => setCategorySuccessMsg(null), 3500);
    } catch (err: any) {
      setCategoryErrorMsg(err.message || 'Error al crear la categoría.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (cat: CategoryConfig) => {
    if (!onUpdateConfig) return;
    const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
    const confirmMsg = count > 0
      ? `¿Estás seguro de eliminar la categoría "${cat.name}"? Hay ${count} producto(s) asignados a esta categoría.`
      : `¿Estás seguro de eliminar la categoría "${cat.name}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        const filtered = activeCategories.filter((c) => c.id !== cat.id && c.name !== cat.name);
        await onUpdateConfig({ categories: filtered });
        setCategorySuccessMsg(`Categoría "${cat.name}" eliminada.`);
        setTimeout(() => setCategorySuccessMsg(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Error al eliminar categoría');
      }
    }
  };

  // Filtered products list in table
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = filterCat === 'all' || p.category === filterCat;
      const matchSearch =
        p.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(filterSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(filterSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, filterCat, filterSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-stone-800" />
                <span>Gestión de Catálogo y Categorías</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Cloud className="w-3 h-3 text-emerald-600" />
                Nube Activa (Multidispositivo)
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
              Edita precios en USD en vivo, agrega productos de supermercado y <strong>personaliza los logos e imágenes de cada categoría</strong> para que tus clientes disfruten de un catálogo interactivo con iconos y fotos.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {managerTab === 'products' ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddCategoryModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Categoría</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Alert */}
        {categorySuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{categorySuccessMsg}</span>
          </div>
        )}

        {/* Sub-Tabs: Products vs Categories */}
        <div className="flex items-center gap-2 border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={() => setManagerTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              managerTab === 'products'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos & Precios ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setManagerTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              managerTab === 'categories'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categorías & Logos ({activeCategories.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRODUCT LIST & LIVE PRICE EDITOR                  */}
      {/* ======================================================== */}
      {managerTab === 'products' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-4">
          
          {/* Table Search & Filter Bar */}
          <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Buscar producto por nombre, SKU o categoría..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg font-medium text-stone-700 focus:outline-none focus:border-stone-900"
              >
                <option value="all">Todas las Categorías ({products.length})</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setManagerTab('categories')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Editar Logos de Categorías</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-stone-200">
              <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Precio USD ($)</th>
                  <th className="py-3 px-4">Equivalente {config.secondaryCurrencyCode}</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-stone-400">
                      No hay productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((product) => {
                    const currentPriceUSD =
                      priceEdits[product.id] !== undefined
                        ? parseFloat(priceEdits[product.id]) || product.priceUSD
                        : product.priceUSD;

                    const convertedBs = formatSecondary(
                      currentPriceUSD,
                      config.baseExchangeRate,
                      config.secondaryCurrencySymbol,
                      config.secondaryCurrencyCode
                    );

                    const isSaved = savedFeedbacks[product.id];
                    const isStockSaved = savedFeedbacks[`stock-${product.id}`];

                    // Find category info to show category logo thumbnail
                    const catObj = activeCategories.find(
                      (c) => c.name.toLowerCase() === product.category.toLowerCase()
                    );

                    return (
                      <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Product info with thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                            />
                            <div>
                              <div className="font-semibold text-stone-900 line-clamp-1 flex items-center gap-1.5">
                                <span>{product.name}</span>
                                {product.badge && (
                                  <span className="px-1.5 py-0.2 text-[10px] bg-stone-100 text-stone-700 font-medium rounded">
                                    {product.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-stone-500 flex items-center gap-2 mt-0.5">
                                <span>SKU: {product.sku}</span>
                                <span>·</span>
                                <button
                                  onClick={() => handleOpenEditModal(product)}
                                  className="text-emerald-700 hover:text-emerald-800 font-medium underline"
                                >
                                  Editar datos
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category badge with mini logo */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200">
                            {catObj?.imageUrl ? (
                              <img
                                src={catObj.imageUrl}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <Tag className="w-3 h-3 text-stone-500" />
                            )}
                            <span className="text-stone-800 font-medium">{product.category}</span>
                          </div>
                        </td>

                        {/* Quick Live Price Editor (USD) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-2 text-stone-400 font-bold font-mono text-xs">
                                $
                              </span>
                             <input 
  type="number" 
  step="any" 
  min="0" 
  value={priceEdits[product.id] !== undefined ? priceEdits[product.id] : product.priceUSD.toString()} 
  onChange={(e) => setPriceEdits((prev) => ({...prev, [product.id]: e.target.value}))} 
  className="..." 
/>
                                onChange={(e) =>
                                  setPriceEdits((prev) => ({
                                    ...prev,
                                    [product.id]: e.target.value
                                  }))
                                }
                                className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-stone-900 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                              />
                            </div>

                            {priceEdits[product.id] !== undefined &&
                              parseFloat(priceEdits[product.id]) !== product.priceUSD && (
                                <button
                                  onClick={() => handleSavePrice(product)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-2xs"
                                  title="Guardar precio en la nube"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              )}

                            {isSaved && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 animate-in fade-in">
                                <Check className="w-3.5 h-3.5" />
                                <span>¡Listo!</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Calculated BS in real time */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-emerald-700 tabular-nums">
                          {convertedBs}
                        </td>

                        {/* Quick Stock Edit */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={
                                stockEdits[product.id] !== undefined
                                  ? stockEdits[product.id]
                                  : product.stock.toString()
                              }
                              onChange={(e) =>
                                setStockEdits((prev) => ({
                                  ...prev,
                                  [product.id]: e.target.value
                                }))
                              }
                              className="w-16 px-2 py-1.5 text-xs font-mono border border-stone-300 rounded-lg text-center"
                            />
                            {stockEdits[product.id] !== undefined &&
                              parseInt(stockEdits[product.id], 10) !== product.stock && (
                                <button
                                  onClick={() => handleSaveStock(product)}
                                  className="p-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs"
                                  title="Guardar stock"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              )}
                            {isStockSaved && (
                              <span className="text-[10px] text-emerald-700 font-bold">✓</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Editar producto completo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CATEGORY & LOGO MANAGEMENT                        */}
      {/* ======================================================== */}
      {managerTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 mb-2">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Catálogo Visual Interactivo 24/7
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Logos y Nombres de Categorías
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
                Coloca la imagen o logo oficial de cada categoría (ej: Harina, Lácteos, Café, Enlatados). Estos logos aparecerán directamente en los botones táctiles de la página principal para que los clientes reconozcan y elijan al instante.
              </p>
            </div>
          </div>

          {/* Grid of Categories with Edit Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCategories.map((cat) => {
              const assignedCount = products.filter(
                (p) => p.category.toLowerCase() === cat.name.toLowerCase()
              ).length;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Logo + Name */}
                    <div className="flex items-start gap-3.5">
                      {/* Category Logo Preview */}
                      <div className="relative group shrink-0">
                        {cat.imageUrl ? (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-50 border-2 border-stone-200/90 shadow-xs flex items-center justify-center p-0.5">
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex flex-col items-center justify-center shadow-xs">
                            <Layers className="w-6 h-6" />
                            <span className="text-[9px] font-bold mt-1 text-emerald-200">Sin Logo</span>
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-stone-900 text-white p-1 rounded-full shadow-xs">
                          <ImageIcon className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {cat.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold shrink-0">
                            {assignedCount} {assignedCount === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>

                        {cat.badgeText && (
                          <p className="text-[11px] font-medium text-emerald-700 truncate mt-0.5">
                            {cat.badgeText}
                          </p>
                        )}

                        <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-snug">
                          {cat.description || 'Categoría de productos de supermercado.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category Card Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Logo y Nombre</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT CATEGORY & UPLOAD CUSTOM LOGO                */}
      {/* ======================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseEditCategory}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Editar Categoría y Logo
                </h3>
                <p className="text-xs text-stone-500">
                  Sube una imagen/logo para esta categoría o modifica su nombre y descripción.
                </p>
              </div>
            </div>

            {categoryErrorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{categoryErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Ej: Víveres & Despensa"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900 font-semibold"
                />
              </div>

              {/* Logo / Image Picker */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-800">
                  Logo / Imagen Oficial de la Categoría
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-300 shrink-0 flex items-center justify-center">
                    {catImageInput ? (
                      <img
                        src={catImageInput}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-2xs">
                      {isProcessingCatImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Logo desde tu Celular / PC</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCategoryLogo}
                        disabled={isProcessingCatImage}
                        className="hidden"
                      />
                    </label>

                    {catImageInput && (
                      <button
                        type="button"
                        onClick={() => setCatImageInput('')}
                        className="block text-[11px] text-rose-600 hover:text-rose-700 underline font-medium"
                      >
                        Quitar logo personalizado (usar icono)
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset image suggestions */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                    O selecciona una foto de muestra para esta categoría:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_IMAGES.slice(0, 5).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCatImageInput(preset.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                          catImageInput === preset.url
                            ? 'border-emerald-600 ring-2 ring-emerald-500/50'
                            : 'border-stone-200 opacity-60 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={catImageInput}
                    onChange={(e) => setCatImageInput(e.target.value)}
                    placeholder="O pega una URL directa de imagen..."
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono text-stone-600 bg-white"
                  />
                </div>
              </div>

              {/* Badge & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Subtítulo / Etiqueta Resumida
                  </label>
                  <input
                    type="text"
                    value={catBadgeInput}
                    onChange={(e) => setCatBadgeInput(e.target.value)}
                    placeholder="Ej: Harina, Arroz, Pasta"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Descripción Breve
                  </label>
                  <input
                    type="text"
                    value={catDescInput}
                    onChange={(e) => setCatDescInput(e.target.value)}
                    placeholder="Ej: Víveres esenciales para la cocina"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Auto update products checkbox */}
              {editingCategory.name.toLowerCase() !== catNameInput.trim().toLowerCase() && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="updateProdsCheck"
                    checked={catUpdateProducts}
                    onChange={(e) => setCatUpdateProducts(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="updateProdsCheck" className="cursor-pointer">
                    <strong>Actualizar productos:</strong> Cambiar automáticamente la categoría de todos los productos que actualmente dicen "{editingCategory.name}" a "{catNameInput.trim()}".
                  </label>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleCloseEditCategory}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingCategory ? 'Guardando en la Nube...' : 'Guardar Cambios de Categoría'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW CATEGORY WITH CUSTOM LOGO              */}
      {/* ======================================================== */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Crear Nueva Categoría
                </h3>
                <p className="text-xs text-stone-500">
                  Agrega una nueva categoría al supermercado y asígnale su logo representativo.
                </p>
              </div>
            </div>

            {categoryErrorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{categoryErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de la Nueva Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej: Panadería & Repostería"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900 font-semibold"
                />
              </div>

              {/* Logo / Image Picker */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-800">
                  Logo / Imagen de la Categoría
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-300 shrink-0 flex items-center justify-center">
                    {newCatImage ? (
                      <img
                        src={newCatImage}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-2xs">
                      {isProcessingNewCatImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Logo desde tu Celular / PC</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadNewCatLogo}
                        disabled={isProcessingNewCatImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    placeholder="O pega una URL directa de imagen..."
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg font-mono text-stone-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Subtítulo / Etiqueta Resumida
                  </label>
                  <input
                    type="text"
                    value={newCatBadge}
                    onChange={(e) => setNewCatBadge(e.target.value)}
                    placeholder="Ej: Pan, Dulces, Tortas"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Descripción Breve
                  </label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Ej: Frescos del día"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreatingCategory ? 'Creando Categoría...' : 'Guardar y Activar Categoría'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT PRODUCT DETAILS                              */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseEditModal}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Editar Producto</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Modifica los datos y precios. Los cambios se guardan permanentemente en la nube.
                  </p>
                </div>
              </div>
            </div>

            {editFormError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej: Harina de Maíz Blanco Precocida 1kg"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 font-medium"
                />
              </div>

              {/* Price, Category and Stock Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Precio en USD ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-stone-400">$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      required
                      value={editPriceUSD}
                      onChange={(e) => setEditPriceUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  {editPriceUSD && !isNaN(parseFloat(editPriceUSD)) && (
                    <span className="text-[10px] text-emerald-700 font-mono mt-1 block">
                      ≈ {formatSecondary(parseFloat(editPriceUSD), config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode)}
                    </span>
                  )}
                </div>

                {/* Category Selection with Logos */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900 font-medium"
                  >
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Otra categoría personalizada...</option>
                  </select>

                  {editCategory === '__custom__' && (
                    <input
                      type="text"
                      required
                      value={customEditCatInput}
                      onChange={(e) => setCustomEditCatInput(e.target.value)}
                      placeholder="Escribe la nueva categoría..."
                      className="mt-2 w-full px-2.5 py-1.5 text-xs border border-emerald-400 rounded-lg font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Badge & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Etiqueta / Badge (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    placeholder="Ej: Más Vendido, Novedad, Oferta"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="SKU-001"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descripción detallada del producto..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 leading-relaxed"
                />
              </div>

              {/* Product Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Foto del Producto</span>
                  <span className="text-[10px] font-normal text-stone-500">
                    Sube desde tu celular / PC o selecciona un producto de muestra
                  </span>
                </label>

                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 mb-2.5">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 bg-white shrink-0">
                    {editImage ? (
                      <img
                        src={editImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors">
                      {isProcessingEditImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Optimizando foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-stone-200" />
                          <span>Subir Foto desde Celular / PC</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadEditImage}
                        disabled={isProcessingEditImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditImage(preset.url)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                        editImage === preset.url
                          ? 'border-emerald-600 ring-2 ring-emerald-400/40'
                          : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="URL de la imagen del producto..."
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg font-mono text-stone-600"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Características (1 por línea)
                </label>
                <textarea
                  rows={2}
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  placeholder="100% Maíz Seleccionado&#10;Presentación de 1 Kilogramo&#10;Entrega Inmediata"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingEdit ? 'Guardando Cambios...' : 'Guardar Cambios del Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NEW PRODUCT                                   */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-stone-900">Agregar Nuevo Producto</h3>
              <p className="text-xs text-stone-500 mt-1">
                El producto se agregará al catálogo y quedará guardado permanentemente en la nube.
              </p>
            </div>

            {addFormError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Harina de Maíz Blanco Precocida 1kg"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Precio en USD ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-stone-400">$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      required
                      value={newPriceUSD}
                      onChange={(e) => setNewPriceUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  {newPriceUSD && !isNaN(parseFloat(newPriceUSD)) && (
                    <span className="text-[10px] text-emerald-700 font-mono mt-1 block">
                      ≈ {formatSecondary(parseFloat(newPriceUSD), config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode)}
                    </span>
                  )}
                </div>

                {/* Category selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900 font-medium"
                  >
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Otra categoría nueva...</option>
                  </select>

                  {newCategory === '__custom__' && (
                    <input
                      type="text"
                      required
                      value={customNewCatInput}
                      onChange={(e) => setCustomNewCatInput(e.target.value)}
                      placeholder="Escribe la nueva categoría..."
                      className="mt-2 w-full px-2.5 py-1.5 text-xs border border-emerald-400 rounded-lg font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Etiqueta (Badge)
                  </label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="Más Vendido, Básico, Oferta"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Foto Predefinida
                  </label>
                  <select
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                  >
                    {PRESET_IMAGES.map((p, i) => (
                      <option key={i} value={p.url}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles y beneficios del producto..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Preset & Device Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Foto del Producto</span>
                  <span className="text-[10px] font-normal text-stone-500">
                    Sube desde tu celular / PC o selecciona un preset
                  </span>
                </label>

                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 mb-2.5">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 bg-white shrink-0">
                    {newImage ? (
                      <img
                        src={newImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors">
                      {isProcessingAddImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Optimizando foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-stone-200" />
                          <span>Subir Foto de este Equipo / Cámara</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadNewImage}
                        disabled={isProcessingAddImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-stone-500 mt-1">
                      JPG, PNG, WebP. Se optimiza automáticamente para carga ultra rápida.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewImage(preset.url)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                        newImage === preset.url
                          ? 'border-emerald-600 ring-2 ring-emerald-400/40'
                          : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="O pega una URL de imagen..."
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg font-mono text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Características (1 por línea)
                </label>
                <textarea
                  rows={2}
                  value={newFeatures}
                  onChange={(e) => setNewFeatures(e.target.value)}
                  placeholder="100% Maíz Seleccionado&#10;Presentación de 1 Kilogramo&#10;Garantía de calidad"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Guardando...' : 'Guardar Producto en el Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
