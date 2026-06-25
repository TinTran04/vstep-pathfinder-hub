using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class AddExamAttemptAutosaveFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ExamAttempts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentSkill",
                table: "ExamAttempts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DraftStateJson",
                table: "ExamAttempts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "ExamAttempts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "ExamAttempts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAutosavedAt",
                table: "ExamAttempts",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ExamAttempts");

            migrationBuilder.DropColumn(
                name: "CurrentSkill",
                table: "ExamAttempts");

            migrationBuilder.DropColumn(
                name: "DraftStateJson",
                table: "ExamAttempts");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "ExamAttempts");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "ExamAttempts");

            migrationBuilder.DropColumn(
                name: "LastAutosavedAt",
                table: "ExamAttempts");
        }
    }
}
