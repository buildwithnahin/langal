<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Main Appointment Booking Table
     */
    public function up(): void
    {
        Schema::create('consultation_appointments', function (Blueprint $table) {
            $table->increments('appointment_id');
            $table->string('appointment_code', 20)->unique()->comment('Unique readable code (e.g., APT-2026-00001)');
            $table->integer('farmer_id')->comment('FK to users (farmer)');
            $table->integer('expert_id')->comment('FK to users (expert)');
            
            // Scheduling Details
            $table->date('scheduled_date')->comment('Appointment date');
            $table->time('scheduled_start_time')->comment('Start time');
            $table->time('scheduled_end_time')->comment('End time');
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            
            // Consultation Type
            $table->enum('consultation_type', ['audio', 'video', 'chat'])->default('audio');
            
            // Status Management
            $table->enum('status', [
                'pending',           // Farmer requested, waiting for expert
                'approved',          // Expert approved
                'rejected',          // Expert rejected
                'rescheduled',       // Expert proposed new time
                'confirmed',         // Farmer confirmed rescheduled time
                'in_progress',       // Call/chat ongoing
                'completed',         // Consultation finished
                'cancelled',         // Either party cancelled
                'no_show_farmer',    // Farmer didn't join
                'no_show_expert'     // Expert didn't join
            ])->default('pending');
            
            // Problem Details
            $table->string('topic', 150)->comment('Main topic/subject');
            $table->text('problem_description')->comment('Detailed problem description');
            $table->string('crop_type', 100)->nullable()->comment('Related crop (if any)');
            $table->enum('urgency', ['low', 'medium', 'high', 'urgent'])->default('medium');
            
            // Rescheduling (if expert proposes new time)
            $table->date('proposed_date')->nullable();
            $table->time('proposed_start_time')->nullable();
            $table->time('proposed_end_time')->nullable();
            $table->string('reschedule_reason', 255)->nullable();
            $table->unsignedTinyInteger('reschedule_count')->default(0);
            
            // Notes
            $table->text('farmer_notes')->nullable();
            $table->text('expert_notes')->nullable();
            $table->string('cancellation_reason', 255)->nullable();
            $table->integer('cancelled_by')->nullable();
            
            // Call Room Details (for Agora)
            $table->string('room_id', 100)->nullable()->unique()->comment('Unique room ID for call');
            $table->string('agora_channel', 100)->nullable()->comment('Agora channel name');
            $table->text('agora_token')->nullable()->comment('Agora access token');
            $table->timestamp('token_expiry')->nullable();
            
            // Timestamps
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('responded_at')->nullable()->comment('When expert responded');
            $table->timestamp('started_at')->nullable()->comment('When call/chat started');
            $table->timestamp('ended_at')->nullable()->comment('When call/chat ended');
            $table->timestamps();
            
            // Indexes
            $table->index('farmer_id', 'idx_appointment_farmer');
            $table->index('expert_id', 'idx_appointment_expert');
            $table->index('scheduled_date', 'idx_appointment_date');
            $table->index('status', 'idx_appointment_status');
            $table->index(['scheduled_date', 'scheduled_start_time'], 'idx_appointment_datetime');
            $table->index(['expert_id', 'scheduled_date', 'status'], 'idx_appointments_expert_date');
            
            // Foreign Keys
            $table->foreign('farmer_id')
                  ->references('user_id')
                  ->on('users')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('expert_id')
                  ->references('user_id')
                  ->on('users')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_appointments');
    }
};
