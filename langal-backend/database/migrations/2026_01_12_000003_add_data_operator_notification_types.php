<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Create new data_operator_notifications table
     */
    public function up(): void
    {
        Schema::create('data_operator_notifications', function (Blueprint $table) {
            $table->id('notification_id');
            $table->integer('recipient_id')->comment('Data operator user_id');
            $table->integer('sender_id')->nullable()->comment('User who triggered the notification');
            
            // Notification type
            $table->enum('notification_type', [
                'new_farmer_registration',
                'new_expert_registration', 
                'new_customer_registration',
                'post_report',
                'comment_report',
                'field_data_submission',
                'system'
            ])->default('system');
            
            // Content
            $table->string('title', 255);
            $table->text('message');
            
            // Related entity (user_id for registration, report_id for reports)
            $table->string('related_entity_type', 50)->nullable()->comment('user, post_report, comment_report');
            $table->string('related_entity_id', 50)->nullable();
            
            // Status
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            // Priority
            $table->enum('priority', ['low', 'normal', 'high'])->default('normal');
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('recipient_id');
            $table->index(['recipient_id', 'is_read']);
            $table->index('notification_type');
            $table->index('created_at');
            
            // Foreign key
            $table->foreign('recipient_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_operator_notifications');
    }
};
