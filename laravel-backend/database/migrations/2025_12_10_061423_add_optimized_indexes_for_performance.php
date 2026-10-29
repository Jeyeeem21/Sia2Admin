<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function safeIndex(string $table, $columns, string $indexName): void
    {
        try {
            // Check table exists
            if (!Schema::hasTable($table)) return;

            // Check all columns exist
            $cols = is_array($columns) ? $columns : [$columns];
            foreach ($cols as $col) {
                if (!Schema::hasColumn($table, $col)) return;
            }

            // Check index doesn't already exist
            $indexes = Schema::getIndexes($table);
            foreach ($indexes as $index) {
                if ($index['name'] === $indexName) return;
            }

            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                $table->index($columns, $indexName);
            });
        } catch (\Exception $e) {
            // Skip failed indexes silently - non-critical optimization
        }
    }

    /**
     * Run the migrations.
     * Add optimized indexes for frequently queried columns
     */
    public function up(): void
    {
        // Products indexes
        $this->safeIndex('products', 'status', 'idx_products_status_v2');
        $this->safeIndex('products', 'barcode', 'idx_products_barcode_v2');
        $this->safeIndex('products', 'category_id', 'idx_products_category_v2');
        $this->safeIndex('products', ['status', 'category_id'], 'idx_products_status_cat');

        // Orders indexes
        $this->safeIndex('orders', 'status', 'idx_orders_status');
        $this->safeIndex('orders', 'order_number', 'idx_orders_order_number');
        $this->safeIndex('orders', 'completed_date', 'idx_orders_completed_date');
        $this->safeIndex('orders', 'created_at', 'idx_orders_created_at');
        $this->safeIndex('orders', ['status', 'completed_date'], 'idx_orders_status_completed');

        // Order items indexes
        $this->safeIndex('order_items', 'order_id', 'idx_order_items_order_id');
        $this->safeIndex('order_items', 'product_id', 'idx_order_items_product_id');
        $this->safeIndex('order_items', ['order_id', 'product_id'], 'idx_order_items_order_product');

        // Inventories indexes
        $this->safeIndex('inventories', 'product_id', 'idx_inventories_product_id');
        $this->safeIndex('inventories', 'quantity', 'idx_inventories_quantity');
        $this->safeIndex('inventories', ['product_id', 'quantity'], 'idx_inventories_product_qty');

        // Categories indexes
        $this->safeIndex('categories', 'status', 'idx_categories_status');
        $this->safeIndex('categories', 'category_name', 'idx_categories_name');

        // Payments indexes
        $this->safeIndex('payments', 'order_id', 'idx_payments_order_id');
        $this->safeIndex('payments', 'payment_date', 'idx_payments_payment_date');
        $this->safeIndex('payments', 'payment_method', 'idx_payments_method');

        // Product transactions indexes
        $this->safeIndex('product_transactions', 'product_id', 'idx_product_transactions_product_id');
        $this->safeIndex('product_transactions', 'type', 'idx_product_transactions_type');
        $this->safeIndex('product_transactions', 'created_at', 'idx_product_transactions_created_at');
        $this->safeIndex('product_transactions', ['product_id', 'type'], 'idx_product_transactions_product_type');
        $this->safeIndex('product_transactions', ['product_id', 'created_at'], 'idx_product_transactions_product_date');

        // Rental properties indexes
        $this->safeIndex('rental_properties', 'status', 'idx_rental_properties_status');
        $this->safeIndex('rental_properties', 'stall_number', 'idx_rental_properties_stall');

        // Rental contracts indexes
        $this->safeIndex('rental_contracts', 'property_id', 'idx_rental_contracts_property_id');
        $this->safeIndex('rental_contracts', 'tenant_id', 'idx_rental_contracts_tenant_id');
        $this->safeIndex('rental_contracts', 'status', 'idx_rental_contracts_status');
        $this->safeIndex('rental_contracts', ['property_id', 'status'], 'idx_rental_contracts_property_status');

        // Rental payments indexes
        $this->safeIndex('rental_payments', 'contract_id', 'idx_rental_payments_contract_id');
        $this->safeIndex('rental_payments', 'payment_date', 'idx_rental_payments_payment_date');

        // Rental maintenance indexes
        $this->safeIndex('rental_maintenance', 'property_id', 'idx_rental_maintenance_property_id');
        $this->safeIndex('rental_maintenance', 'status', 'idx_rental_maintenance_status');

        // Toga departments indexes
        $this->safeIndex('toga_departments', 'department_name', 'idx_toga_departments_name');

        // Toga rentals indexes
        $this->safeIndex('toga_rentals', 'department_id', 'idx_toga_rentals_department_id');
        $this->safeIndex('toga_rentals', 'student_id', 'idx_toga_rentals_student_id');
        $this->safeIndex('toga_rentals', ['department_id', 'student_id'], 'idx_toga_rentals_dept_student');

        // Toga payments indexes
        $this->safeIndex('toga_payments', 'rental_id', 'idx_toga_payments_rental_id');
        $this->safeIndex('toga_payments', 'payment_date', 'idx_toga_payments_payment_date');

        // Users indexes
        $this->safeIndex('users', 'email', 'idx_users_email');
        $this->safeIndex('users', 'role', 'idx_users_role');

        // Staff info indexes
        $this->safeIndex('staff_info', 'email', 'idx_staff_info_email');
        $this->safeIndex('staff_info', 'user_id', 'idx_staff_info_user_id');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_status');
            $table->dropIndex('idx_products_barcode');
            $table->dropIndex('idx_products_category_id');
            $table->dropIndex('idx_products_status_category');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status');
            $table->dropIndex('idx_orders_order_number');
            $table->dropIndex('idx_orders_completed_date');
            $table->dropIndex('idx_orders_created_at');
            $table->dropIndex('idx_orders_status_completed');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_order_id');
            $table->dropIndex('idx_order_items_product_id');
            $table->dropIndex('idx_order_items_order_product');
        });

        Schema::table('inventories', function (Blueprint $table) {
            $table->dropIndex('idx_inventories_product_id');
            $table->dropIndex('idx_inventories_quantity');
            $table->dropIndex('idx_inventories_product_qty');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('idx_categories_status');
            $table->dropIndex('idx_categories_name');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_order_id');
            $table->dropIndex('idx_payments_payment_date');
            $table->dropIndex('idx_payments_method');
        });

        Schema::table('product_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_product_transactions_product_id');
            $table->dropIndex('idx_product_transactions_type');
            $table->dropIndex('idx_product_transactions_created_at');
            $table->dropIndex('idx_product_transactions_product_type');
            $table->dropIndex('idx_product_transactions_product_date');
        });

        Schema::table('rental_properties', function (Blueprint $table) {
            $table->dropIndex('idx_rental_properties_status');
            $table->dropIndex('idx_rental_properties_stall');
        });

        Schema::table('rental_contracts', function (Blueprint $table) {
            $table->dropIndex('idx_rental_contracts_property_id');
            $table->dropIndex('idx_rental_contracts_tenant_id');
            $table->dropIndex('idx_rental_contracts_status');
            $table->dropIndex('idx_rental_contracts_property_status');
        });

        Schema::table('rental_payments', function (Blueprint $table) {
            $table->dropIndex('idx_rental_payments_contract_id');
            $table->dropIndex('idx_rental_payments_payment_date');
        });

        Schema::table('rental_maintenance', function (Blueprint $table) {
            $table->dropIndex('idx_rental_maintenance_property_id');
            $table->dropIndex('idx_rental_maintenance_status');
        });

        Schema::table('toga_departments', function (Blueprint $table) {
            $table->dropIndex('idx_toga_departments_name');
        });

        Schema::table('toga_rentals', function (Blueprint $table) {
            $table->dropIndex('idx_toga_rentals_department_id');
            $table->dropIndex('idx_toga_rentals_student_id');
            $table->dropIndex('idx_toga_rentals_dept_student');
        });

        Schema::table('toga_payments', function (Blueprint $table) {
            $table->dropIndex('idx_toga_payments_rental_id');
            $table->dropIndex('idx_toga_payments_payment_date');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_email');
            $table->dropIndex('idx_users_role');
        });

        Schema::table('staff_info', function (Blueprint $table) {
            $table->dropIndex('idx_staff_info_email');
            $table->dropIndex('idx_staff_info_user_id');
        });
    }
};
