<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the admin user account.
     */
    public function run(): void
    {
        // Create default admin account
        User::updateOrCreate(
            ['email' => 'jmpagaran24@gmail.com'],
            [
                'full_name' => 'System Administrator',
                'password' => Hash::make('admin123'),
                'phone' => '09123456789',
                'role' => 'Admin',
                'status' => 'active',
                'email_verified' => true,
            ]
        );

        // Create additional test admin (optional)
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'full_name' => 'Test Admin',
                'password' => Hash::make('password'),
                'phone' => '09987654321',
                'role' => 'Admin',
                'status' => 'active',
                'email_verified' => true,
            ]
        );

        // Create staff user
        User::updateOrCreate(
            ['email' => 'staff@sia.com'],
            [
                'full_name' => 'Staff User',
                'password' => Hash::make('staff123'),
                'phone' => '09111222333',
                'role' => 'Staff',
                'status' => 'active',
                'email_verified' => true,
            ]
        );

        $this->command->info('✅ Admin accounts created successfully!');
        $this->command->info('📧 Admin Email: admin@sia.com | Password: admin123');
        $this->command->info('📧 Test Email: test@example.com | Password: password');
        $this->command->info('📧 Staff Email: staff@sia.com | Password: staff123');
    }
}
