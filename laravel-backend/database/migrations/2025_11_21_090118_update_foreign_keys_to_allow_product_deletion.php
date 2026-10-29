<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Update foreign key constraints to allow product deletion while preserving history
     */
    public function up(): void
    {
        // Check if we're using MySQL
        if (DB::getDriverName() === 'mysql') {
            // Use raw SQL to drop and recreate the foreign key constraint (MySQL)
            DB::statement('ALTER TABLE order_items DROP FOREIGN KEY order_items_product_id_foreign');
            DB::statement('ALTER TABLE order_items MODIFY product_id BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_foreign 
                           FOREIGN KEY (product_id) REFERENCES products(product_id) 
                           ON DELETE SET NULL');
        } else {
            // SQLite approach - recreate the table with new constraint
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });
            
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('product_id')->nullable()->change();
                $table->foreign('product_id')
                    ->references('product_id')
                    ->on('products')
                    ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if we're using MySQL
        if (DB::getDriverName() === 'mysql') {
            // Revert back to original constraint (MySQL)
            DB::statement('ALTER TABLE order_items DROP FOREIGN KEY order_items_product_id_foreign');
            DB::statement('ALTER TABLE order_items MODIFY product_id BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_foreign 
                           FOREIGN KEY (product_id) REFERENCES products(product_id) 
                           ON DELETE RESTRICT');
        } else {
            // SQLite approach
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });
            
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('product_id')->nullable(false)->change();
                $table->foreign('product_id')
                    ->references('product_id')
                    ->on('products')
                    ->onDelete('restrict');
            });
        }
    }
};
