<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle login request
     */
    public function login(Request $request)
    {
        try {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if user exists
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if account is active
        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is inactive. Please contact an administrator.'],
            ]);
        }

        // Check password
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login (best effort — don't fail login if this fails)
        try {
            $user->update(['last_login' => now()]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to update last_login: ' . $e->getMessage());
        }

        // Create token
        try {
            $token = $user->createToken('auth-token')->plainTextToken;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Token creation failed: ' . $e->getMessage());
            return response()->json(['message' => 'Token creation failed: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'email' => $user->email,
                'role' => strtolower($user->role), // Convert to lowercase for consistency
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status,
            ],
            'token' => $token,
        ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Login error: ' . $e->getMessage() . ' ' . $e->getTraceAsString());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Handle logout request
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->full_name,
            'email' => $user->email,
            'role' => strtolower($user->role),
            'phone' => $user->phone,
            'avatar_url' => $user->avatar_url,
            'status' => $user->status,
        ]);
    }
}
