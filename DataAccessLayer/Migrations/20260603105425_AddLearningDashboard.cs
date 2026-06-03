using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningDashboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationUsedSeconds",
                table: "WritingSubmissions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RewardPoints",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DurationUsedSeconds",
                table: "SpeakingSubmissions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExamMode",
                table: "Exams",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "test");

            migrationBuilder.CreateTable(
                name: "UserRewardLedgers",
                columns: table => new
                {
                    UserRewardLedgerId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    RewardType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceId = table.Column<int>(type: "integer", nullable: true),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRewardLedgers", x => x.UserRewardLedgerId);
                    table.ForeignKey(
                        name: "FK_UserRewardLedgers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserRewardLedgers_UserId_RewardType_SourceType_SourceId",
                table: "UserRewardLedgers",
                columns: new[] { "UserId", "RewardType", "SourceType", "SourceId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRewardLedgers");

            migrationBuilder.DropColumn(
                name: "DurationUsedSeconds",
                table: "WritingSubmissions");

            migrationBuilder.DropColumn(
                name: "RewardPoints",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DurationUsedSeconds",
                table: "SpeakingSubmissions");

            migrationBuilder.DropColumn(
                name: "ExamMode",
                table: "Exams");
        }
    }
}
