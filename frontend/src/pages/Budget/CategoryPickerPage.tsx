import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../_components/Modal";
import EditCategoryModal from "../../_components/Categories/EditCategoryModal";

interface Category {
    ID: number;
    Pavadinimas: string;
}

function CategoryPickerPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`/api/categories`, {
                method: 'GET',
                credentials: 'include',
            });
            
            if (!response.ok) throw new Error("Failed to fetch categories");
            
            const data = await response.json();
            setCategories(data.data || data);
        } catch (err: any) {
            console.error("Category fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (category: Category) => {
        setSelectedCategory(category);
        setEditName(category.Pavadinimas);
        setIsEditModalOpen(true);
    };

    const handleEdit = async () => {
        if (!selectedCategory || !editName.trim()) return;

        try {
            const response = await fetch(`/api/categories/${selectedCategory.ID}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pavadinimas: editName.trim(),
                }),
            });

            if (!response.ok) throw new Error("Failed to update category");

            // Update state
            setCategories(categories.map(cat => 
                cat.ID === selectedCategory.ID 
                    ? { ...cat, Pavadinimas: editName.trim() } 
                    : cat
            ));
            
            setIsEditModalOpen(false);
            setSelectedCategory(null);
        } catch (err: any) {
            console.error("Edit error:", err);
            alert("Failed to update category");
        }
    };

    const openDeleteModal = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleCategoryUpdated = (updatedCategory: any) => {
        fetchCategories();
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        try {
            const response = await fetch(`/api/categories/${selectedCategory.ID}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) throw new Error("Failed to delete category");

            // Remove from state
            setCategories(categories.filter(cat => cat.ID !== selectedCategory.ID));
            setIsDeleteModalOpen(false);
            setSelectedCategory(null);
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Failed to delete category");
        }
    };

    return (
        <div className="page-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Categories</h1>
                <button 
                    className="btn-primary"
                    onClick={() => navigate('../create-category')}
                >
                    Create New Category
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {categories.map((category) => (
                    <div 
                        key={category.ID} 
                        className="card"
                    >
                        <h3 style={{ margin: 0, fontSize: "1.25rem", marginBottom: "1rem" }}>{category.Pavadinimas}</h3>
                        
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                            <button 
                                className="btn-primary"
                                style={{ flex: 1, padding: "0.5rem" }}
                                onClick={() => openEditModal(category)}
                            >
                                Edit
                            </button>
                            <button 
                                style={{ 
                                    flex: 1, 
                                    padding: "0.5rem", 
                                    backgroundColor: "#f44336", 
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                }}
                                onClick={() => openDeleteModal(category)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <EditCategoryModal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCategory(null);
                }}
                categoryId={selectedCategory?.ID}
                onUpdated={handleCategoryUpdated}
            />

            {/* Delete Confirmation Modal */}
            <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <h2>Delete Category</h2>
                <p>Are you sure you want to delete "{selectedCategory?.Pavadinimas}"?</p>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                    <button 
                        style={{ 
                            flex: 1, 
                            padding: "0.5rem", 
                            backgroundColor: "#f44336", 
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                    <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        style={{ flex: 1, padding: "0.5rem" }}
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default CategoryPickerPage;