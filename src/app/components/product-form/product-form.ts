import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../services/cart.service';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  isEditMode = false;
  productId?: number;
  
  product = {
    name: '',
    description: '',
    wholesalePrice: 0,
    customOrderPrice: 0,
    retailPrice: 0,
    originalPrice: undefined as number | undefined,
    category: '',
    image: '',
    isNew: false,
    onSale: false,
    stock: 0
  };

  categories: string[] = [];
  isSubmitting = false;
  errors: { [key: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.categories = this.productService.getCategories();
    
    // Check if we're in edit mode
    this.productId = +this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
  }

  loadProduct() {
    if (this.productId) {
      const existingProduct = this.productService.getProductById(this.productId);
      if (existingProduct) {
        this.product = {
          name: existingProduct.name,
          description: existingProduct.description,
          wholesalePrice: existingProduct.wholesalePrice,
          customOrderPrice: existingProduct.customOrderPrice,
          retailPrice: existingProduct.retailPrice,
          originalPrice: existingProduct.originalPrice,
          category: existingProduct.category,
          image: existingProduct.image,
          isNew: existingProduct.isNew || false,
          onSale: existingProduct.onSale || false,
          stock: existingProduct.stock || 0
        };
      } else {
        alert('Producto no encontrado');
        this.router.navigate(['/products']);
      }
    }
  }

  onSubmit() {
    if (this.validateForm() && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        if (this.isEditMode && this.productId) {
          // Update existing product
          const updated = this.productService.updateProduct(this.productId, this.product);
          if (updated) {
            alert('Producto actualizado exitosamente');
            this.router.navigate(['/products']);
          } else {
            alert('Error al actualizar el producto');
          }
        } else {
          // Create new product
          const created = this.productService.createProduct(this.product);
          if (created) {
            alert('Producto creado exitosamente');
            this.router.navigate(['/products']);
          } else {
            alert('Error al crear el producto');
          }
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el producto');
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Required fields
    if (!this.product.name.trim()) {
      this.errors['name'] = 'El nombre es requerido';
      isValid = false;
    }

    if (!this.product.description.trim()) {
      this.errors['description'] = 'La descripción es requerida';
      isValid = false;
    }

    if (!this.product.category.trim()) {
      this.errors['category'] = 'La categoría es requerida';
      isValid = false;
    }

    if (!this.product.image.trim()) {
      this.errors['image'] = 'La URL de la imagen es requerida';
      isValid = false;
    }

    // Price validations
    if (this.product.wholesalePrice <= 0) {
      this.errors['wholesalePrice'] = 'El precio mayorista debe ser mayor a 0';
      isValid = false;
    }

    if (this.product.customOrderPrice <= 0) {
      this.errors['customOrderPrice'] = 'El precio por encargo debe ser mayor a 0';
      isValid = false;
    }

    if (this.product.retailPrice <= 0) {
      this.errors['retailPrice'] = 'El precio al público debe ser mayor a 0';
      isValid = false;
    }

    // Price logic validation
    if (this.product.wholesalePrice > this.product.customOrderPrice) {
      this.errors['customOrderPrice'] = 'El precio por encargo debe ser mayor al precio mayorista';
      isValid = false;
    }

    if (this.product.customOrderPrice > this.product.retailPrice) {
      this.errors['retailPrice'] = 'El precio al público debe ser mayor al precio por encargo';
      isValid = false;
    }

    // Stock validation
    if (this.product.stock < 0) {
      this.errors['stock'] = 'El stock no puede ser negativo';
      isValid = false;
    }

    // Original price validation
    if (this.product.originalPrice && this.product.originalPrice <= this.product.retailPrice) {
      this.errors['originalPrice'] = 'El precio original debe ser mayor al precio al público';
      isValid = false;
    }

    return isValid;
  }

  onCancel() {
    this.router.navigate(['/products']);
  }

  addNewCategory() {
    const newCategory = prompt('Ingresa el nombre de la nueva categoría:');
    if (newCategory && newCategory.trim()) {
      this.product.category = newCategory.trim();
      if (!this.categories.includes(newCategory.trim())) {
        this.categories.push(newCategory.trim());
      }
    }
  }

  previewImage() {
    if (this.product.image) {
      window.open(this.product.image, '_blank');
    }
  }

  generateSampleImage() {
    // Generate a sample image URL (you can customize this)
    const width = 300;
    const height = 220;
    const category = this.product.category.toLowerCase();
    this.product.image = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
  }

  calculateSuggestedPrices() {
    if (this.product.retailPrice > 0) {
      // Suggest wholesale price (20% less)
      this.product.wholesalePrice = Math.round(this.product.retailPrice * 0.8);
      
      // Suggest custom order price (10% less)
      this.product.customOrderPrice = Math.round(this.product.retailPrice * 0.9);
    }
  }
}