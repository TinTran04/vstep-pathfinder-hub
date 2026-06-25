using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackJsonToSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeedbackJson",
                table: "WritingSubmissions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeedbackJson",
                table: "SpeakingSubmissions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Transcript",
                table: "SpeakingSubmissions",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeedbackJson",
                table: "WritingSubmissions");

            migrationBuilder.DropColumn(
                name: "FeedbackJson",
                table: "SpeakingSubmissions");

            migrationBuilder.DropColumn(
                name: "Transcript",
                table: "SpeakingSubmissions");
        }
    }
}
